import { join, resolve } from "path";
import {
  CreateEntityControllerParams,
  DsgContext,
  Module,
} from "@amplication/code-gen-types";
import { parse, print, readFile } from "@amplication/code-gen-utils";
import { namedTypes } from "ast-types/gen/namedTypes";
import { builders, visit } from "ast-types";
import { addImports } from "../util/ast";
import { camelCase } from "camel-case";

const controllerTemplatePath = join(
  resolve(__dirname, "./templates"),
  "controller.template.ts"
);

export const beforeCreateEntityController = async (
  context: DsgContext,
  eventParams: CreateEntityControllerParams
) => {
  const template = await readFile(controllerTemplatePath);
  return { ...eventParams, template };
};

const updateControllerImports = (
  template: namedTypes.File,
  entityName: string
) => {
  const entityNameCamelCase = camelCase(entityName);
  console.log({entityNameCamelCase});

  const lowerCaseEntity = entityName.toLowerCase();
  // remove all default DTOs imports
  visit(template, {
    visitImportDeclaration(path) {
      if (path.value.source.value.toLowerCase().includes(entityName.toLowerCase())) {
        path.prune();
      }

      this.traverse(path);
    },
  });
  // create the new DTOs imports
  const serviceImport = builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(`${entityNameCamelCase}Service`))],
    builders.stringLiteral(
      `../app/${lowerCaseEntity}/services/${lowerCaseEntity}.service`
    )
  );
  const createDtoImport = builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(`${entityNameCamelCase}CreateInput`))],
    builders.stringLiteral(
      `../app/${lowerCaseEntity}/model/dtos/${entityNameCamelCase}CreateInput.dto`
    )
  );
  // const whereDtoImport = builders.importDeclaration(
  //   [builders.importSpecifier(builders.identifier(`${entityName}WhereInput`))],
  //   builders.stringLiteral(
  //     `../app/${lowerCaseEntity}/model/dtos/${entityName}WhereInput.dto`
  //   )
  // );
  const whereUniqueDtoImport = builders.importDeclaration(
    [
      builders.importSpecifier(
        builders.identifier(`${entityNameCamelCase}WhereUniqueInput`)
      ),
    ],
    builders.stringLiteral(
      `../app/${lowerCaseEntity}/model/dtos/${entityNameCamelCase}WhereUniqueInput.dto`
    )
  );
  const findManyArgsDtoImport = builders.importDeclaration(
    [
      builders.importSpecifier(
        builders.identifier(`${entityNameCamelCase}FindManyArgs`)
      ),
    ],
    builders.stringLiteral(
      `../app/${lowerCaseEntity}/model/dtos/${entityName}FindManyArgs.dto`
    )
  );
  const updateInputDtoImport = builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(`${entityNameCamelCase}UpdateInput`))],
    builders.stringLiteral(
      `../app/${lowerCaseEntity}/model/dtos/${entityNameCamelCase}UpdateInput.dto`
    )
  );
  const entityDtoImport = builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(entityNameCamelCase))],
    builders.stringLiteral(
      `../app/${lowerCaseEntity}/model/dtos/${entityNameCamelCase}.dto`
    )
  );

  addImports(template, [
    serviceImport,
    createDtoImport,
    whereUniqueDtoImport,
    findManyArgsDtoImport,
    updateInputDtoImport,
    entityDtoImport,
  ]);
};

export const afterCreateEntityController = (
  context: DsgContext,
  eventParams: CreateEntityControllerParams,
  modules: Module[]
) => {
  try {
    const file = parse(modules[0].code);
    updateControllerImports(file, eventParams.entityName);

    const modulePath = `server/src/web-server/${eventParams.entityName}.controller.ts`;
    modules[0] = {
      path: modulePath,
      code: print(file).code
    }

    return modules;
  } catch (error) {
    console.log(error);
    return modules;
  }
  return modules;
};