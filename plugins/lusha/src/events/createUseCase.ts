import { join, resolve } from "path";
import { Module } from "@amplication/code-gen-types";
import { readFile, print } from "@amplication/code-gen-utils";
import { builders, namedTypes } from "ast-types";
import { addInjectableDependency } from "../util/nestjs-code-generation";
import { addImports, getClassDeclarationById, interpolate } from "../util/ast";

type UseCasesCrud =
  | "Count"
  | "FindMany"
  | "FindOne"
  | "Create"
  | "Update"
  | "Delete";

// const useCasesByAction = ["Count", "FindMany", "FindOne", "Create", "Update", "Delete"];
const useCasesByAction = ["Count"];
const useCaseTemplatePath = join(
  resolve(__dirname, "./templates"),
  "useCase.template.ts"
);

export const createUseCasesCrud = async (entityName: string) => {
  const template = await readFile(useCaseTemplatePath);

  const useCasesModules = useCasesByAction.reduce<Module[]>(
    (modules, useCase) => {
      const useCaseModuleTemp = createUsCaseModule(
        useCase as UseCasesCrud,
        template,
        entityName
      );

      useCaseModuleTemp && modules.push(useCaseModuleTemp);

      return modules;
    },
    [] as Module[]
  );

  return useCasesModules;
};

const createUsCaseModule = (
  useCase: UseCasesCrud,
  template: namedTypes.File,
  entityName: string
) => {
  const templateMapping = {
    USE_CASE: builders.identifier(`${entityName}UseCase`),
    USE_CASE_DTO: builders.identifier(entityName),
  };

  const useCaseId = builders.identifier(`${entityName}UseCase`);

  interpolate(template, templateMapping);
  const classDeclaration = getClassDeclarationById(template, useCaseId);

  createClassImport(template, entityName, useCase);
  createdConstructorStatements(classDeclaration, entityName);
  const classMethodExecute = createClassMethod(entityName, useCase);

  classDeclaration.body.body.push(classMethodExecute);

  return {
    path: `server/src/app/${entityName}/use-cases/${useCase}${entityName}UseCase.ts`,
    code: print(template).code,
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

  addImports(template, [dtoImport, repositoryImport]);
};

const createdConstructorStatements = (classDeclaration: namedTypes.ClassDeclaration, entityName: string) => {
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
    FindMany: `<${entityName}[]>`,
    FindOne: `<${entityName} | null>`,
  };
  const getReturnType = (useCase: string) =>
     returnTypeMap[useCase as keyof typeof returnTypeMap] || `<${entityName}>`;

  return builders.classMethod(
    "method",
    builders.identifier("execute"),
    [builders.identifier("args")],
    builders.tsTypeAnnotation(
      builders.tsTypeReference(
        builders.identifier("Promise"),
        builders.tsTypeParameterInstantiation([
          builders.tsTypeReference(builders.identifier(getReturnType(useCase))),
        ])
      )
    ),
    builders.blockStatement([
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
            [builders.identifier("args")]
          )
        )
      ),
    ])
  );
};
