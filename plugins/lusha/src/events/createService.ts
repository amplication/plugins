import { join, resolve } from "path";
import { addImports } from "../util/ast";
import { createUseCasesCrud } from "./createUseCase";
import { createRepositoryModule } from "./createRepository";
import {
  CreateEntityServiceBaseParams,
  DsgContext,
  Module,
} from "@amplication/code-gen-types";
import { readFile, print } from "@amplication/code-gen-utils";
import { builders } from "ast-types";
import { IdentifierKind } from "ast-types/gen/kinds";

interface UseCaseObj {
  FIND_MANY_USE_CASE: string;
  FIND_ONE_USE_CASE: string;
  CREATE_USE_CASE: string;
  UPDATE_USE_CASE: string;
  DELETE_USE_CASE: string;
}

const serviceTemplatePath = join(
  resolve(__dirname, "./templates"),
  "service.template.ts"
);

const serviceIndexTemplatePath = join(
  resolve(__dirname, "./templates"),
  "index.template.ts"
);

export const beforeCreateEntityServiceBase = async (
  context: DsgContext,
  eventParams: CreateEntityServiceBaseParams
) => {
  const { entity, templateMapping } = eventParams;
  const template = await readFile(serviceTemplatePath);

  const useCaseObj = setUseCasesObj(entity.name);
  const ENTITY_PATH = builders.stringLiteral(
    `../model/dtos/${entity.name}.dto`
  );

  Object.assign(templateMapping, {
    CREATE_ARGS: builders.identifier(`Create${entity.name}Args`),
    UPDATE_ARGS: builders.identifier(`Update${entity.name}Args`),
    DELETE_ARGS: builders.identifier(`Delete${entity.name}Args`),
    ...useCaseObj,
  });

  const dtosImport = setDtosImports([
    templateMapping.FIND_MANY_ARGS,
    templateMapping.FIND_ONE_ARGS,
    templateMapping.CREATE_ARGS,
    templateMapping.UPDATE_ARGS,
    templateMapping.DELETE_ARGS,
  ]);

  const useCaseImport = builders.importDeclaration(
    getUseCaseImports(useCaseObj),
    builders.stringLiteral("../use-cases")
  );
  const entityImport = builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(entity.name))],
    ENTITY_PATH
  );

  addImports(template, [useCaseImport, entityImport, ...dtosImport]);

  return { ...eventParams, template };
};

export const afterCreateEntityServiceBase = async (
  context: DsgContext,
  eventParams: CreateEntityServiceBaseParams,
  modules: Module[]
) => {
  try {
    const indexTemplate = await readFile(serviceIndexTemplatePath);
    const modulePath = `server/src/app/${eventParams.entityName}/services/${eventParams.entityName}.service.ts`;
    modules[0].path = modulePath;

    const useCaseModules = await createUseCasesCrud(eventParams.entity.name);
    const repositoryModule = await createRepositoryModule(
      eventParams.entity.name
    );

    const exportUseCaseName = builders.exportAllDeclaration(
      builders.stringLiteral(`./${eventParams.entityName}.service`),
      null
    );

    indexTemplate.program.body.unshift(exportUseCaseName);

    const indexFile = {
      path: `server/src/app/${eventParams.entityName}/services/index.ts`,
      code: print(indexTemplate).code,
    };

    return [
      ...modules,
      ...useCaseModules,
      ...repositoryModule,
      indexFile,
    ];
  } catch (error) {
    console.log(error);
    return modules;
  }
};

export const setUseCasesObj = (entityName: string) => ({
  FIND_MANY_USE_CASE: `FindMany${entityName}UseCase`,
  FIND_ONE_USE_CASE: `FindOne${entityName}UseCase`,
  CREATE_USE_CASE: `Create${entityName}UseCase`,
  UPDATE_USE_CASE: `Update${entityName}UseCase`,
  DELETE_USE_CASE: `Delete${entityName}UseCase`,
});

export const getUseCaseImports = (useCaseObj: UseCaseObj) =>
  Object.values(useCaseObj).map((useCase: string) =>
    builders.importSpecifier(builders.identifier(useCase))
  );

const setDtosImports = (dtosArr: IdentifierKind[]) =>
  dtosArr.map((dto: IdentifierKind) =>
    builders.importDeclaration(
      [builders.importSpecifier(dto)],
      builders.stringLiteral(`../model/dtos/${dto.name}.dto`)
    )
  );
