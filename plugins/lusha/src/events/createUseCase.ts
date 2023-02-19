import { join, resolve } from "path";
import { Module } from "@amplication/code-gen-types";
import { readFile, print } from "@amplication/code-gen-utils";
import { builders, namedTypes } from "ast-types";
import { addInjectableDependency } from "../util/nestjs-code-generation";
import { addImports, getClassDeclarationById, interpolate } from "../util/ast";

type ModuleUseCase = {
  module: Module;
  fileName: string;
};

type UseCasesCrud =
  | "Count"
  | "FindMany"
  | "FindOne"
  | "Create"
  | "Update"
  | "Delete";

const useCasesByAction = ["Count", "FindMany", "FindOne", "Create", "Update", "Delete"];
const useCaseTemplatePath = join(
  resolve(__dirname, "./templates"),
  "useCase.template.ts"
);
const useCaseIndexTemplatePath = join(
  resolve(__dirname, "./templates"),
  "index.template.ts"
);

export const createUseCasesCrud = async (entityName: string) => {
  const useCasesLength = useCasesByAction.length;
  const useCasesModules: Module[] = [];
  const indexTemplate = await readFile(useCaseIndexTemplatePath);
  for (let i=0; i < useCasesLength; i++) {
    const template = await readFile(useCaseTemplatePath);
    const useCaseModuleTemp = await createUsCaseModule(
      useCasesByAction[i] as UseCasesCrud,
      template,
      entityName
    );

    useCaseModuleTemp && useCasesModules.push(useCaseModuleTemp.module);
    const exportUseCaseName = builders.exportAllDeclaration(
      builders.stringLiteral(useCaseModuleTemp.fileName),
      null
    );

    indexTemplate.program.body.unshift(exportUseCaseName);
  }

  const indexFile = {
    path: `server/src/app/${entityName}/use-cases/index.ts`,
    code: print(indexTemplate).code,
  };

  return [...useCasesModules, indexFile];
};

const createUsCaseModule = async (
  useCase: UseCasesCrud,
  template: namedTypes.File,
  entityName: string
): Promise<ModuleUseCase> => {
  const useCaseClass = `${useCase}${entityName}UseCase`
  const templateMapping = {
    USE_CASE: builders.identifier(useCaseClass),
    USE_CASE_DTO: builders.identifier(`${entityName}${useCase}`), 
  };

  const useCaseId = builders.identifier(useCaseClass);

  interpolate(template, templateMapping);
  const classDeclaration = getClassDeclarationById(template, useCaseId);

  createClassImport(template, entityName, useCase);
  createdConstructorStatements(classDeclaration, entityName);
  const classMethodExecute = createClassMethod(entityName, useCase);

  classDeclaration.body.body.push(classMethodExecute);

  return {
    module: {
      path: `server/src/app/${entityName}/use-cases/${useCaseClass}.ts`,
      code: print(template).code,
    },
    fileName: `./${useCaseClass}`,
  };
};
/**
 * Add repository interface import and entity dto import and useCase args
 * @param template
 */
const createClassImport = (
  template: namedTypes.File,
  entityName: string,
  useCase: UseCasesCrud
) => {
  const dtoName = `${entityName}${useCase}`;

  const dtoImport = builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(dtoName))],
    builders.stringLiteral(`../model/dtos/${dtoName}.dto`)
  );

  const repositoryImport = builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(`I${entityName}Repository`))],
    builders.stringLiteral(
      `../model/interfaces/repositories/${entityName}-repository.interface`
    )
  );

  const dtoArgsName = `${entityName}${useCase}Args`;
  const useCaseArgsImport = builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(dtoArgsName))],
    builders.stringLiteral(`../model/dtos/${dtoArgsName}.dto`)
  );

  addImports(template, [dtoImport, repositoryImport, useCaseArgsImport]);
};

const createdConstructorStatements = (
  classDeclaration: namedTypes.ClassDeclaration,
  entityName: string
) => {
  const repositoryIdentifier = builders.identifier(`I${entityName}Repository`);
  addInjectableDependency(
    classDeclaration,
    `${entityName.toLowerCase()}Repository`,
    repositoryIdentifier,
    "private"
  );
};

const createClassMethod = (entityName: string, useCase: UseCasesCrud) => {
  const returnTypeMap = {
    Count: "number",
    FindMany: `${entityName}[]`,
    FindOne: `${entityName} | null`,
  };
  const getReturnType = (useCase: string) =>
    returnTypeMap[useCase as keyof typeof returnTypeMap] || `${entityName}`;

  return builders.classMethod.from({
    body: builders.blockStatement([
      builders.returnStatement(
        builders.awaitExpression(
          builders.callExpression(
            builders.memberExpression(
              builders.memberExpression(
                builders.thisExpression(),
                builders.identifier(`${entityName.toLowerCase()}Repository`)
              ),
              builders.identifier(
                `${useCase.charAt(0).toLowerCase()}${useCase.slice(1)}`
              )
            ),
            [
              builders.identifier("args"),
            ]
          )
        )
      ),
    ]),
    async: true,
    key: builders.identifier("execute"),
    params: [builders.identifier.from({
      name: "args",
      typeAnnotation: builders.tsTypeAnnotation(builders.tsTypeReference(builders.identifier(`${entityName}${useCase}Args`)))
    }),],
    returnType: builders.tsTypeAnnotation(
      builders.tsTypeReference(
        builders.identifier("Promise"),
        builders.tsTypeParameterInstantiation([
          builders.tsTypeReference(builders.identifier(getReturnType(useCase))),
        ])
      )
    ),
  });
};
