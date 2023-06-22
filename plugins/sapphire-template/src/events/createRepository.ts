import { join, resolve } from "path";
import { readFile, print } from "@amplication/code-gen-utils";
import { builders, namedTypes } from "ast-types";
import { addImports, getClassDeclarationById, interpolate } from "../util/ast";
import { capitalizeFirstLetter } from "../util/utils";

const repositoryTemplatePath = join(
  resolve(__dirname, "./templates"),
  "repository.template.ts"
);

const repositoryInterfaceTemplatePath = join(
  resolve(__dirname, "./templates"),
  "repository.interface.template.ts"
);

export const createRepositoryModule = async (entityName: string) => {
  const repositoryTemplate = await readFile(repositoryTemplatePath);
  const entityCapitalFirst = capitalizeFirstLetter(entityName);
  const templateMapping = {
    ENTITY_REPOSITORY: builders.identifier(`${entityCapitalFirst}Repository`),
    ENTITY_REPOSITORY_INTERFACE: builders.identifier(
      `I${entityCapitalFirst}Repository`
    ),
    ENTITY: builders.identifier(entityCapitalFirst),
    ENTITY_PRISMA: builders.identifier(entityName),
    COUNT_ARGS: builders.identifier(`Prisma.${entityCapitalFirst}CountArgs`),
    FIND_MANY_ARGS: builders.identifier(
      `Prisma.${entityCapitalFirst}FindManyArgs`
    ),
    FIND_ONE_ARGS: builders.identifier(
      `Prisma.${entityCapitalFirst}FindUniqueArgs`
    ),
    CREATE_ARGS: builders.identifier(`Prisma.${entityCapitalFirst}CreateArgs`),
    UPDATE_ARGS: builders.identifier(`Prisma.${entityCapitalFirst}UpdateArgs`),
    DELETE_ARGS: builders.identifier(`Prisma.${entityCapitalFirst}DeleteArgs`),
  };

  interpolate(repositoryTemplate, templateMapping);
  createClassImport(repositoryTemplate, entityCapitalFirst);

  const repositoryInterfaceModule = await createRepositoryInterfaceModule(
    entityName
  );

  return [
    {
      path: `server/src/app/${entityName}/repositories/${entityName.toLowerCase()}.repository.ts`,
      code: print(repositoryTemplate).code,
    },
    repositoryInterfaceModule,
  ];
};

const createClassImport = (template: namedTypes.File, entityName: string) => {
  const repositoryInterfaceImport = builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(`I${entityName}Repository`))],
    builders.stringLiteral(
      `../model/interfaces/repositories/${entityName}-repository.interface`
    )
  );

  const entityNameToUpper =
    entityName.charAt(0).toUpperCase() + entityName.slice(1);

  const entityImport = builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(entityNameToUpper))],
    builders.stringLiteral(`../model/dtos/${entityName}`)
  );

  addImports(template, [repositoryInterfaceImport, entityImport]);
};

const createRepositoryInterfaceModule = async (entityName: string) => {
  const entityCapitalFirst = capitalizeFirstLetter(entityName);
  const repositoryInterfaceTemplate = await readFile(
    repositoryInterfaceTemplatePath
  );
  const templateMapping = {
    ENTITY_REPOSITORY_INTERFACE: builders.identifier(
      `I${entityCapitalFirst}Repository`
    ),
    ENTITY: builders.identifier(entityCapitalFirst),
    COUNT_ARGS: builders.identifier(`Prisma.${entityCapitalFirst}CountArgs`),
    FIND_MANY_ARGS: builders.identifier(
      `Prisma.${entityCapitalFirst}FindManyArgs`
    ),
    FIND_ONE_ARGS: builders.identifier(
      `Prisma.${entityCapitalFirst}FindUniqueArgs`
    ),
    CREATE_ARGS: builders.identifier(`Prisma.${entityCapitalFirst}CreateArgs`),
    UPDATE_ARGS: builders.identifier(`Prisma.${entityCapitalFirst}UpdateArgs`),
    DELETE_ARGS: builders.identifier(`Prisma.${entityCapitalFirst}DeleteArgs`),
  };

  interpolate(repositoryInterfaceTemplate, templateMapping);
  createInterfaceImport(repositoryInterfaceTemplate, entityCapitalFirst);

  return {
    path: `server/src/app/${entityName}/model/interfaces/repositories/${entityName.toLowerCase()}-repository.interface.ts`,
    code: print(repositoryInterfaceTemplate).code,
  };
};

const createInterfaceImport = (
  template: namedTypes.File,
  entityName: string
) => {
  const entityImport = builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(entityName))],
    builders.stringLiteral(`../../dtos/${entityName}`)
  );

  addImports(template, [entityImport]);
};
