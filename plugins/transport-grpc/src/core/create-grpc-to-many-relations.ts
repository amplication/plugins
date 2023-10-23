import {
  CreateEntityControllerGrpcToManyRelationMethodsParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { readFile } from "@amplication/code-gen-utils";
import { builders } from "ast-types";
import {
  getClassDeclarationById,
  getClassMethodByIdName,
  interpolate,
} from "../util/ast";
import {
  controllerToManyIdsActionPairs,
} from "./create-method-id-action-entity-map";
import { join } from "path";
import { templatesPath } from "../constants";
import { buildGrpcMethodDecorator } from "./create-base-grpc-controller";

const toManyRelationMethodsGrpcPath = join(
  templatesPath,
  "to-many.grpc.template.ts"
);

export async function createGrpcControllerToManyRelationMethods(
  context: DsgContext,
  eventParams: CreateEntityControllerGrpcToManyRelationMethodsParams
): Promise<void> {
  try {
    const { toManyMapping, field, entity } = eventParams;

    const toManyRelationMethodsGrpcPathTemplate = await readFile(
      toManyRelationMethodsGrpcPath
    );
    interpolate(toManyRelationMethodsGrpcPathTemplate, toManyMapping);

    const classDeclaration = getClassDeclarationById(
      toManyRelationMethodsGrpcPathTemplate,
      builders.identifier("Mixin")
    );

    controllerToManyIdsActionPairs(toManyMapping,field.name).forEach(
      ({ methodId, methodName }) => {
        const classMethod = getClassMethodByIdName(classDeclaration, methodId);
        classMethod?.decorators?.push(
          buildGrpcMethodDecorator(entity.name, methodName)
        );
      }
    );

    eventParams.toManyFile = toManyRelationMethodsGrpcPathTemplate;
  } catch (error) {
    console.error(error);
  }
}
