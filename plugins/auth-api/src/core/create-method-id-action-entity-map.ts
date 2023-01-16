import { Entity, EnumEntityAction } from "@amplication/code-gen-types";
import { namedTypes } from "ast-types";

type MethodsIdsActionEntityTriplet = {
  methodId: namedTypes.Identifier;
  action: EnumEntityAction;
  entity: Entity;
};

export const controllerMethodsIdsActionPairs = (
  templateMapping: { [key: string]: any; },
  entity: Entity
): MethodsIdsActionEntityTriplet[] => [
  {
    methodId: templateMapping[
      "CREATE_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    action: EnumEntityAction.Create,
    entity: entity,
  },
  {
    methodId: templateMapping[
      "FIND_MANY_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    action: EnumEntityAction.Search,
    entity: entity,
  },
  {
    methodId: templateMapping[
      "FIND_ONE_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    action: EnumEntityAction.View,
    entity: entity,
  },
  {
    methodId: templateMapping[
      "UPDATE_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    action: EnumEntityAction.Update,
    entity: entity,
  },
  {
    methodId: templateMapping[
      "DELETE_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    action: EnumEntityAction.Delete,
    entity: entity,
  },
];

export const controllerToManyMethodsIdsActionPairs = (
  toManyMapping: { [key: string]: any; },
  entity: Entity,
  relatedEntity: Entity
): MethodsIdsActionEntityTriplet[] => [
  {
    methodId: toManyMapping["FIND_MANY"],
    action: EnumEntityAction.Search,
    entity: relatedEntity,
  },
  {
    methodId: toManyMapping["UPDATE"],
    action: EnumEntityAction.Update,
    entity: entity,
  },
  {
    methodId: toManyMapping["CONNECT"],
    action: EnumEntityAction.Update,
    entity: entity,
  },
  {
    methodId: toManyMapping["DISCONNECT"],
    action: EnumEntityAction.Delete,
    entity: entity,
  },
];

export const resolverMethodsIdsActionPairs = (
  templateMapping: { [key: string]: any; },
  entity: Entity
): MethodsIdsActionEntityTriplet[] => [
  {
    methodId: templateMapping["CREATE_MUTATION"] as namedTypes.Identifier,
    action: EnumEntityAction.Create,
    entity: entity,
  },
  {
    methodId: templateMapping["ENTITIES_QUERY"] as namedTypes.Identifier,
    action: EnumEntityAction.Search,
    entity: entity,
  },
  {
    methodId: templateMapping["ENTITY_QUERY"] as namedTypes.Identifier,
    action: EnumEntityAction.View,
    entity: entity,
  },
  {
    methodId: templateMapping["UPDATE_MUTATION"] as namedTypes.Identifier,
    action: EnumEntityAction.Update,
    entity: entity,
  },
  {
    methodId: templateMapping["DELETE_MUTATION"] as namedTypes.Identifier,
    action: EnumEntityAction.Delete,
    entity: entity,
  },
];
