import { Entity } from "@amplication/code-gen-types";
import { namedTypes, builders } from "ast-types";

type MethodsIdsActionEntityTriplet = {
  methodId: namedTypes.Identifier;
  entity: Entity;
  methodName: string;
};

type MethodsIdsActionEntity = {
  methodId: namedTypes.Identifier;
  methodName: string;
};

export const enum EnumTemplateType {
  ControllerBase = "ControllerBase",
  ResolverBase = "ResolverBase",
  controllerToManyMethods = "ControllerToManyMethods",
  ResolverToManyMethods = "ResolverToManyMethods",
  ResolverFindOne = "ResolverFindOne",
}

export const controllerMethodsIdsActionPairs = (
  templateMapping: { [key: string]: any },
  entity: Entity
): MethodsIdsActionEntityTriplet[] => [
  {
    methodId: templateMapping[
      "CREATE_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    entity: entity,
    methodName: "create",
  },
  {
    methodId: templateMapping[
      "FIND_MANY_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    entity: entity,
    methodName: "findMany",
  },
  {
    methodId: templateMapping[
      "FIND_ONE_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    entity: entity,
    methodName: "findOne",
  },
  {
    methodId: templateMapping[
      "UPDATE_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    entity: entity,
    methodName: "update",
  },
  {
    methodId: templateMapping[
      "DELETE_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    entity: entity,
    methodName: "delete",
  },
];

export const controllerToManyMethodsIdsActionPairs = (
  relatedEntityName: string
): MethodsIdsActionEntity[] => [
  {
    methodId: builders.identifier(`findMany${relatedEntityName}`),

    methodName: `findMany${relatedEntityName}`,
  },
  {
    methodId: builders.identifier(`update${relatedEntityName}`),
    methodName: `update${relatedEntityName}`,
  },
  {
    methodId: builders.identifier(`connect${relatedEntityName}`),
    methodName: `connect${relatedEntityName}`,
  },
  {
    methodId: builders.identifier(`disconnect${relatedEntityName}`),
    methodName: `disconnect${relatedEntityName}`,
  },
];
