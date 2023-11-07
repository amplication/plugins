import {
  Entity,
  EnumEntityAction,
  EnumEntityPermissionType,
} from "@amplication/code-gen-types";
import { namedTypes } from "ast-types";

type MethodsIdsActionEntityTriplet = {
  methodId: namedTypes.Identifier;
  action: EnumEntityAction;
  entity: Entity;
  permissionType?: EnumEntityPermissionType;
  methodName?: string;
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
  entity: Entity,
): MethodsIdsActionEntityTriplet[] => [
  {
    methodId: templateMapping[
      "CREATE_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    action: EnumEntityAction.Create,
    entity: entity,
    permissionType: entity.permissions.find(
      (p) => p.action === EnumEntityAction.Create,
    )?.type,
  },
  {
    methodId: templateMapping[
      "FIND_MANY_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    action: EnumEntityAction.Search,
    entity: entity,
    permissionType: entity.permissions.find(
      (p) => p.action === EnumEntityAction.Search,
    )?.type,
  },
  {
    methodId: templateMapping[
      "FIND_ONE_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    action: EnumEntityAction.View,
    entity: entity,
    permissionType: entity.permissions.find(
      (p) => p.action === EnumEntityAction.View,
    )?.type,
    methodName: "FIND_ONE_ENTITY_FUNCTION",
  },
  {
    methodId: templateMapping[
      "UPDATE_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    action: EnumEntityAction.Update,
    entity: entity,
    permissionType: entity.permissions.find(
      (p) => p.action === EnumEntityAction.Update,
    )?.type,
  },
  {
    methodId: templateMapping[
      "DELETE_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    action: EnumEntityAction.Delete,
    entity: entity,
    permissionType: entity.permissions.find(
      (p) => p.action === EnumEntityAction.Delete,
    )?.type,
  },
];

export const controllerToManyMethodsIdsActionPairs = (
  toManyMapping: { [key: string]: any },
  entity: Entity,
  relatedEntity: Entity,
): MethodsIdsActionEntityTriplet[] => [
  {
    methodId: toManyMapping["FIND_MANY"],
    action: EnumEntityAction.Search,
    entity: relatedEntity,
    permissionType: relatedEntity.permissions.find(
      (p) => p.action === EnumEntityAction.Search,
    )?.type,
  },
  {
    methodId: toManyMapping["UPDATE"],
    action: EnumEntityAction.Update,
    entity: entity,
    permissionType: entity.permissions.find(
      (p) => p.action === EnumEntityAction.Update,
    )?.type,
  },
  {
    methodId: toManyMapping["CONNECT"],
    action: EnumEntityAction.Update,
    entity: entity,
    permissionType: entity.permissions.find(
      (p) => p.action === EnumEntityAction.Update,
    )?.type,
  },
  {
    methodId: toManyMapping["DISCONNECT"],
    action: EnumEntityAction.Update,
    entity: entity,
    permissionType: entity.permissions.find(
      (p) => p.action === EnumEntityAction.Delete,
    )?.type,
  },
];

export const resolverMethodsIdsActionPairs = (
  templateMapping: { [key: string]: any },
  entity: Entity,
): MethodsIdsActionEntityTriplet[] => [
  {
    methodId: templateMapping["CREATE_MUTATION"] as namedTypes.Identifier,
    action: EnumEntityAction.Create,
    entity: entity,
    permissionType: entity.permissions.find(
      (p) => p.action === EnumEntityAction.Create,
    )?.type,
  },
  {
    methodId: templateMapping["ENTITIES_QUERY"] as namedTypes.Identifier,
    action: EnumEntityAction.Search,
    entity: entity,
    permissionType: entity.permissions.find(
      (p) => p.action === EnumEntityAction.Search,
    )?.type,
  },
  {
    methodId: templateMapping["ENTITY_QUERY"] as namedTypes.Identifier,
    action: EnumEntityAction.View,
    entity: entity,
    permissionType: entity.permissions.find(
      (p) => p.action === EnumEntityAction.View,
    )?.type,
    methodName: "ENTITY_QUERY",
  },
  {
    methodId: templateMapping["UPDATE_MUTATION"] as namedTypes.Identifier,
    action: EnumEntityAction.Update,
    entity: entity,
    permissionType: entity.permissions.find(
      (p) => p.action === EnumEntityAction.Update,
    )?.type,
  },
  {
    methodId: templateMapping["DELETE_MUTATION"] as namedTypes.Identifier,
    action: EnumEntityAction.Delete,
    entity: entity,
    permissionType: entity.permissions.find(
      (p) => p.action === EnumEntityAction.Delete,
    )?.type,
  },
];
