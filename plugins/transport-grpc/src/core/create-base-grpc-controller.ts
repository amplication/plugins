import {
  CreateEntityControllerBaseParams,
  DsgContext,
  Module,
  ModuleMap,
} from "@amplication/code-gen-types";
import { print, parse } from "@amplication/code-gen-utils";
import { builders, namedTypes } from "ast-types";
import {
  addImports,
  getClassDeclarationById,
  getClassMethodById,
  importNames,
} from "../util/ast";
import { controllerMethodsIdsActionPairs } from "./create-method-id-action-entity-map";

export async function createGrpcControllerBase(
  context: DsgContext,
  eventParams: CreateEntityControllerBaseParams,
  modules: ModuleMap
): Promise<Module> {
  try {
    const { entityName, controllerBaseId, templateMapping, entity } =
      eventParams;
    const { serverDirectories } = context;
    const [controllerBaseModule] = modules.modules();
    const file = parse(controllerBaseModule.code);

    const classDeclaration = getClassDeclarationById(file, controllerBaseId);

    controllerMethodsIdsActionPairs(templateMapping, entity).forEach(
      ({ methodId, entity, methodName }) => {
        const classMethod = getClassMethodById(classDeclaration, methodId);
        classMethod?.decorators?.push(
          buildGrpcMethodDecorator(entity.name, methodName)
        );
      }
    );

    const grpcMethodImport = importNames(
      [builders.identifier("GrpcMethod")],
      "@nestjs/microservices"
    );
    addImports(
      file,
      [grpcMethodImport].filter(
        (x) => x //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[]
    );

    // classDeclaration.id = builders.identifier(
    //   `${entity.displayName}ControllerGrpcBase`
    // );

    const fileName = `${entityName}.controller.grpc.base.ts`;

    const filePath = `${serverDirectories.srcDirectory}/${entityName}/base/${fileName}`;

    return {
      code: print(file).code,
      path: filePath,
    };
  } catch (error) {
    console.error(error);
    return { code: "", path: "" };
  }
}

function buildGrpcMethodDecorator(
  entityName: string,
  methodName: string
): namedTypes.Decorator {
  return builders.decorator(
    builders.callExpression(builders.identifier("GrpcMethod"), [
      builders.stringLiteral(`${entityName}Service`),
      builders.stringLiteral(methodName),
    ])
  );
}