import {
  CreateEntityControllerParams,
  DsgContext,
  Module,
  ModuleMap,
} from "@amplication/code-gen-types";
import { print, parse } from "@amplication/code-gen-utils";
import { builders, namedTypes } from "ast-types";
import { addImports, getClassDeclarationById, importNames } from "../util/ast";
import { pascalCase } from "pascal-case";

export async function createGrpcController(
  context: DsgContext,
  eventParams: CreateEntityControllerParams,
  modules: ModuleMap
): Promise<Module> {
  try {
    const { entityName, templateMapping } = eventParams;
    const { serverDirectories } = context;
    const [controllerModule] = modules.modules();
    const file = parse(controllerModule.code);

    const classDeclaration = getClassDeclarationById(
      file,
      templateMapping["CONTROLLER"]
    );

    const controllerGrpcBaseImport = importNames(
      [builders.identifier(`${pascalCase(entityName)}ControllerGrpcBase`)],
      `./base/${entityName}.controller.grpc.base`
    );
    addImports(
      file,
      [controllerGrpcBaseImport].filter(
        (x) => x //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[]
    );

    classDeclaration.id = builders.identifier(
      `${pascalCase(entityName)}ControllerGrpc`
    );

    classDeclaration.superClass = builders.identifier(
      `${pascalCase(entityName)}ControllerGrpcBase`
    );

    const fileName = `${entityName}.controller.grpc.ts`;

    const filePath = `${serverDirectories.srcDirectory}/${entityName}/${fileName}`;

    return {
      code: print(file).code,
      path: filePath,
    };
  } catch (error) {
    console.error(error);
    return { code: "", path: "" };
  }
}
