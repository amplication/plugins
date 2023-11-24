import {
  CreateEntityGrpcControllerBaseParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { readFile } from "@amplication/code-gen-utils";
import { builders, namedTypes } from "ast-types";
import {
  getClassDeclarationById,
  getClassMethodByIdName,
  interpolate,
} from "../util/ast";
import { controllerMethodsIdsActionPairs } from "./create-method-id-action-entity-map";
import { join } from "path";
import { templatesPath } from "../constants";

const controllerBaseGrpcPath = join(
  templatesPath,
  "controller.grpc.base.template.ts",
);

export async function createGrpcControllerBase(
  context: DsgContext,
  eventParams: CreateEntityGrpcControllerBaseParams,
): Promise<void> {
  try {
    const { controllerBaseId, templateMapping, entity } = eventParams;

    const controllerBaseGrpcTemplate = await readFile(controllerBaseGrpcPath);
    interpolate(controllerBaseGrpcTemplate, templateMapping);

    const classDeclaration = getClassDeclarationById(
      controllerBaseGrpcTemplate,
      controllerBaseId,
    );

    controllerMethodsIdsActionPairs(templateMapping, entity).forEach(
      ({ methodId, entity, methodName }) => {
        const classMethod = getClassMethodByIdName(classDeclaration, methodId);
        classMethod?.decorators?.push(
          buildGrpcMethodDecorator(entity.name, methodName),
        );
      },
    );
    eventParams.template = controllerBaseGrpcTemplate;
  } catch (error) {
    console.error(error);
  }
}
export function buildGrpcMethodDecorator(
  entityName: string,
  methodName: string,
): namedTypes.Decorator {
  return builders.decorator(
    builders.callExpression(builders.identifier("GrpcMethod"), [
      builders.stringLiteral(`${entityName}Service`),
      builders.stringLiteral(methodName),
    ]),
  );
}
