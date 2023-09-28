import {
  Entity,
  EnumEntityAction,
  EnumEntityPermissionType,
} from "@amplication/code-gen-types";
import { namedTypes } from "ast-types";

type MethodsIdsActionEntityTriplet = {
  methodId: namedTypes.Identifier;
  entity: Entity;
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
  toManyMapping: { [key: string]: any },
  entity: Entity,
  relatedEntity: Entity
): MethodsIdsActionEntityTriplet[] => [
  {
    methodId: toManyMapping["FIND_MANY"],
    entity: relatedEntity,
    methodName: "findMany",
  },
  {
    methodId: toManyMapping["UPDATE"],
    entity: entity,
    methodName: "update",
  },
  {
    methodId: toManyMapping["CONNECT"],
    entity: entity,
    methodName: "",
  },
  {
    methodId: toManyMapping["DISCONNECT"],
    entity: entity,
    methodName: "",
  },
];
