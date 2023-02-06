import type {
  AmplicationPlugin,
  CreateEntityControllerBaseParams,
  DsgContext,
  Events,
} from "@amplication/code-gen-types";
import {
  getClassDeclarationById,
  getClassMethodById,
  interpolate,
} from "./util/ast";
import { EventNames } from "@amplication/code-gen-types";
import { builders, namedTypes } from "ast-types";

const funcMethodMap = {
  CREATE_ENTITY_FUNCTION: "CREATE_INPUT",
  UPDATE_ENTITY_FUNCTION: "UPDATE_INPUT"
}

class SwaggerApiBody implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateEntityControllerBase]: {
        before: this.beforeCreateControllerBase,
      },
    };
  }

  beforeCreateControllerBase(
    context: DsgContext,
    eventParams: CreateEntityControllerBaseParams
  ) {
    const { templateMapping, template, controllerBaseId } = eventParams;


    const classDeclaration = getClassDeclarationById(
      template,
      controllerBaseId
    );

    Object.keys(funcMethodMap).forEach((funcName) => {
      const methodId = templateMapping[funcName] as namedTypes.Identifier;
      const classMethod = getClassMethodById(classDeclaration, methodId);
      
      const currDecorator = builders.decorator(
        builders.callExpression(
          builders.memberExpression(
            builders.identifier("swagger"),
            builders.identifier("ApiBody")
          ),
          [
            builders.objectExpression([
              builders.objectProperty(
                builders.identifier("type"),
                builders.identifier(funcMethodMap[funcName as keyof typeof funcMethodMap])
              ),
            ]),
          ]
        )
      );

      classMethod?.decorators?.push(currDecorator)
    });

    return eventParams;
  }
}

export default SwaggerApiBody;
