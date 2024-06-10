import { CodeBlock, CsharpSupport } from "@amplication/csharp-ast";

export function CreateSeedDevelopmentDataBody(resourceName: string): CodeBlock {
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

          var user = new IdentityUser { Email = "test@email.com", UserName = "admin" };
        
 
          var password = new PasswordHasher<IdentityUser>();
          var hashed = password.HashPassword(user, "password");
          user.PasswordHash = hashed;
          var userStore = new UserStore<IdentityUser>(context);
          await userStore.CreateAsync(user);
          var _roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
      
          foreach (var role in amplicationRoles)
          {
              await userStore.AddToRoleAsync(user, _roleManager.NormalizeKey(role));
          }
      
      
      await context.SaveChangesAsync();`,
  });
}

// const authEntityDto = (entities: Entity[]): string => {
//   let codeBlock = "";

//   for (const field of fields) {
//     const fieldNamePascalCase = pascalCase(field.name);

//     if (field.dataType == EnumDataType.Lookup) {
//       const relatedEntity = entities.find(
//         (entity) => entity.id === field.properties?.relatedEntityId
//       );

//       const relatedEntityFieldName = pascalCase(field.name);

//       if (field.properties?.allowMultipleSelection) {
//         // the "many" side of the relation
//         codeBlock =
//           codeBlock +
//           `${fieldNamePascalCase} = model.${relatedEntityFieldName}.Select(x => new ${relatedEntity?.name}IdDto {Id = x.Id}).ToList(),\n`;
//       } else {
//         if (field.properties.fkHolderName === authEntity.name) {
//           break;
//         } else {
//           // the "one" side of the relation
//           codeBlock =
//             codeBlock +
//             `${fieldNamePascalCase} = new ${relatedEntity?.name}IdDto { Id = model.${fieldNamePascalCase}Id},\n`;
//         }
//       }
//     } else {
//       codeBlock =
//         codeBlock + `${fieldNamePascalCase} = model.${fieldNamePascalCase},\n`;
//     }
//   }

//   return `var ${camelCase(authEntity.name)} = new ${authEntity.name}
//     {
//       ${codeBlock}
//     };`;
// };
