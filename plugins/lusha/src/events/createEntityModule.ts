import { join, resolve } from "path";
import {
  CreateEntityModuleParams,
  CreatePrismaSchemaParams,
  DsgContext,
  Module,
} from "@amplication/code-gen-types";
import { readFile, print } from "@amplication/code-gen-utils";
import { builders, namedTypes } from "ast-types";
import { addImports, getClassDeclarationById, interpolate } from "../util/ast";
import { getUseCaseImports, setUseCasesObj } from "./createService";

const entityModuleTemplatePath = join(
  resolve(__dirname, "./templates"),
  "entityModule.template.ts"
);

export const afterCreateEntityModule = async (
  context: DsgContext,
  eventParams: CreateEntityModuleParams,
  modules: Module[]
) => {
  const { entityName, templateMapping } = eventParams;
  const camelCaseEntityName = `${entityName
    .slice(0, 1)
    .toUpperCase()}${entityName.slice(1)}`;
  const template = await readFile(entityModuleTemplatePath);
  const useCasesObj = setUseCasesObj(camelCaseEntityName);

  Object.assign(templateMapping, {
    ENTITY_MODULE_CLASS: builders.identifier(
      `Lusha${camelCaseEntityName}Module`
    ),
    ENTITY_CONTROLLER: builders.identifier(`${camelCaseEntityName}Controller`),
    ENTITY_REPOSITORY: builders.identifier(`${camelCaseEntityName}Repository`),
    ENTITY_REPOSITORY_INTERFACE: builders.identifier(
      `I${camelCaseEntityName}Repository`
    ),
    ENTITY_SERVICE: builders.identifier(`${camelCaseEntityName}Service`),
    CREATE_USE_CASE: builders.identifier(useCasesObj.CREATE_USE_CASE),
    DELETE_USE_CASE: builders.identifier(useCasesObj.DELETE_USE_CASE),
    FIND_ONE_USE_CASE: builders.identifier(useCasesObj.FIND_ONE_USE_CASE),
    UPDATE_USE_CASE: builders.identifier(useCasesObj.UPDATE_USE_CASE),
    FIND_MANY_USE_CASE: builders.identifier(useCasesObj.FIND_MANY_USE_CASE),
  });

  interpolate(template, templateMapping);
  createClassImport(template, camelCaseEntityName);

  return [
    {
      path: `server/src/app/${entityName}/${entityName.toLowerCase()}.module.ts`,
      code: print(template).code,
    },
  ];
};

const createClassImport = (template: namedTypes.File, entityName: string) => {
  const controllerImport = builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(`${entityName}Controller`))],
    builders.stringLiteral(
      `../../web-server/${entityName.toLowerCase()}.controller`
    )
  );

  const repositoryImport = builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(`${entityName}Repository`))],
    builders.stringLiteral(
      `./repositories/${entityName.toLowerCase()}.repository`
    )
  );

  const serviceImport = builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(`${entityName}Service`))],
    builders.stringLiteral(`./services`)
  );

  const useCasesObj = setUseCasesObj(entityName);
  const useCasesImport = builders.importDeclaration(
    getUseCaseImports(useCasesObj),
    builders.stringLiteral("./use-cases")
  );

  const repositoryInterfaceImport = builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(`I${entityName}Repository`))],
    builders.stringLiteral(
      `./model/interfaces/repositories/${entityName.toLowerCase()}-repository.interface`
    )
  );

  addImports(template, [
    controllerImport,
    repositoryImport,
    useCasesImport,
    serviceImport,
    repositoryInterfaceImport,
  ]);
};
