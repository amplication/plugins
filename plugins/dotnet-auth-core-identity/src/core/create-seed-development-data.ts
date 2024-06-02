import { Entity, EnumDataType } from "@amplication/code-gen-types";
import { CodeBlock, CsharpSupport } from "@amplication/csharp-ast";
import { camelCase } from "lodash";
import { pascalCase } from "pascal-case";

export function CreateSeedDevelopmentDataBody(
  resourceName: string,
  entity: Entity,
  entities: Entity[]
): CodeBlock {
  const { name, pluralName } = entity;
  const entityNameToCamelCase = camelCase(name);
  const entityNamePluralize = pascalCase(pluralName);
  const entityFirstLatter = entityNameToCamelCase.slice(0, 1);
  return new CodeBlock({
    references: [
      CsharpSupport.classReference({
        name: "Identity",
        namespace: "Microsoft.AspNetCore.Identity",
      }),
      CsharpSupport.classReference({
        name: "EntityFrameworkCore",
        namespace: "Microsoft.AspNetCore.Identity.EntityFrameworkCore",
      }),
      CsharpSupport.classReference({
        name: resourceName,
        namespace: `${resourceName}.Infrastructure`,
      }),
    ],
    code: `var context = serviceProvider.GetRequiredService<${resourceName}DbContext>();
      var amplicationRoles = configuration
          .GetSection("AmplicationRoles")
          .AsEnumerable()
          .Where(x => x.Value != null)
          .Select(x => x.Value.ToString())
          .ToArray();
  
          ${authEntityDto(entity, entities)}
      
      
      if (!context.${entityNamePluralize}.Any(${entityFirstLatter} => ${entityFirstLatter}.UserName == ${entityNameToCamelCase}.UserName))
      {
          var password = new PasswordHasher<${name}>();
          var hashed = password.HashPassword(${entityNameToCamelCase}, "password");
          ${entityNameToCamelCase}.PasswordHash = hashed;
          var userStore = new UserStore<${name}>(context);
          await userStore.CreateAsync(${entityNameToCamelCase});
          var _roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
      
          foreach (var role in amplicationRoles)
          {
              await userStore.AddToRoleAsync(${entityNameToCamelCase}, _roleManager.NormalizeKey(role));
          }
      }
      
      await context.SaveChangesAsync();`,
  });
}

const authEntityDto = (entity: Entity, entities: Entity[]): string => {
  const { fields } = entity;
  let codeBlock = "";

  for (const field of fields) {
    const fieldNamePascalCase = pascalCase(field.name);

    if (field.dataType == EnumDataType.Lookup) {
      const relatedEntity = entities.find(
        (entity) => entity.id === field.properties?.relatedEntityId
      );

      const relatedEntityFieldName = pascalCase(field.name);

      if (field.properties?.allowMultipleSelection) {
        // the "many" side of the relation
        codeBlock =
          codeBlock +
          `${fieldNamePascalCase} = model.${relatedEntityFieldName}.Select(x => new ${relatedEntity?.name}IdDto {Id = x.Id}).ToList(),\n`;
      } else {
        if (field.properties.fkHolderName === entity.name) {
          break;
        } else {
          // the "one" side of the relation
          codeBlock =
            codeBlock +
            `${fieldNamePascalCase} = new ${relatedEntity?.name}IdDto { Id = model.${fieldNamePascalCase}Id},\n`;
        }
      }
    } else {
      codeBlock =
        codeBlock + `${fieldNamePascalCase} = model.${fieldNamePascalCase},\n`;
    }
  }

  return `var ${camelCase(entity.name)} = new ${entity.name}
    {
      ${codeBlock}
    };`;
};
