import { join, resolve } from "path";
import { readFile, print } from "@amplication/code-gen-utils";
import { builders, namedTypes } from "ast-types";
import { addImports, getClassDeclarationById, interpolate } from "../util/ast";

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
  const entityNameToUpper =
    entityName.charAt(0).toUpperCase() + entityName.slice(1);
  const templateMapping = {
    ENTITY_REPOSITORY: builders.identifier(`${entityName}Repository`),
    ENTITY_REPOSITORY_INTERFACE: builders.identifier(
      `I${entityName}Repository`
    ),
    ENTITY: builders.identifier(entityNameToUpper),
    ENTITY_PRISMA:  builders.identifier(entityName),
    COUNT_ARGS: builders.identifier(`Prisma.${entityNameToUpper}CountArgs`),
    FIND_MANY_ARGS: builders.identifier(`Prisma.${entityNameToUpper}FindManyArgs`),
    FIND_ONE_ARGS: builders.identifier(`Prisma.${entityNameToUpper}FindUniqueArgs`),
    CREATE_ARGS: builders.identifier(`Prisma.${entityNameToUpper}CreateArgs`),
    UPDATE_ARGS: builders.identifier(`Prisma.${entityNameToUpper}UpdateArgs`),
    DELETE_ARGS: builders.identifier(`Prisma.${entityNameToUpper}DeleteArgs`),
  };

  interpolate(repositoryTemplate, templateMapping);
  createClassImport(repositoryTemplate, entityName);

  const repositoryInterfaceModule = await createRepositoryInterfaceModule(
    entityName
  );

  return [
    {
      path: `server/src/app/${entityName}/repositories/${entityName}.repository.ts`,
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
    builders.stringLiteral(`../model/dtos/${entityName}.dto`)
  );

  addImports(template, [repositoryInterfaceImport, entityImport]);
};

const createRepositoryInterfaceModule = async (entityName: string) => {
  const repositoryInterfaceTemplate = await readFile(
    repositoryInterfaceTemplatePath
  );
  const templateMapping = {
    ENTITY_REPOSITORY_INTERFACE: builders.identifier(
      `I${entityName}Repository`
    ),
    ENTITY: builders.identifier(entityName),
    COUNT_ARGS: builders.identifier(`Prisma.${entityName}CountArgs`),
    FIND_MANY_ARGS: builders.identifier(`Prisma.${entityName}FindManyArgs`),
    FIND_ONE_ARGS: builders.identifier(`Prisma.${entityName}FindUniqueArgs`),
    CREATE_ARGS: builders.identifier(`Prisma.${entityName}CreateArgs`),
    UPDATE_ARGS: builders.identifier(`Prisma.${entityName}UpdateArgs`),
    DELETE_ARGS: builders.identifier(`Prisma.${entityName}DeleteArgs`),
  };

  interpolate(repositoryInterfaceTemplate, templateMapping);
  createInterfaceImport(repositoryInterfaceTemplate, entityName);

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
    builders.stringLiteral(`../../dtos/${entityName}.dto`)
  );

  addImports(template, [entityImport]);
};
