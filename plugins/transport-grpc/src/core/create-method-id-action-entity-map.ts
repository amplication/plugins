import { Entity } from "@amplication/code-gen-types";
import { namedTypes, builders } from "ast-types";
import { pascalCase } from "pascal-case";

type MethodsIdsActionEntityTriplet = {
  methodId: namedTypes.Identifier;
  entity: Entity;
  methodName: string;
  inputObjectName: string;
  outputObjectName: string;
};

type methodMessage = {
  name: string;
  enumMessageType: EnumMessageType;
};

type MethodsIdsActionEntity = {
  methodName: string;
  inputObjectName: string;
  outputObjectName: string;
};

type ControllersIdsActionEntity = {
  methodId: namedTypes.Identifier;
  methodName: string;
};

export enum EnumMessageType {
  Empty = "empty",
  Create = "create",
  EntityObject = "entityObject",
  EntityWhereInput = "entityWhereInput",
  EntityUpdateInput = "entityUpdateInput",
  RelatedEntityObject = "relatedEntityObject",
  RelatedEntityWhereInputObject = "relatedEntityWhereInputObject",
  CombineWhereUniqInput = "combineWhereUniqInput",
}

export const controllerMethodsIdsActionPairs = (
  templateMapping: { [key: string]: namedTypes.Identifier },
  entity: Entity
): MethodsIdsActionEntityTriplet[] => [
  {
    methodId: templateMapping[
      "CREATE_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    entity: entity,
    methodName: "create",
    inputObjectName: `${pascalCase(entity.name)}CreateInput`,
    outputObjectName: pascalCase(entity.name),
  },
  {
    methodId: templateMapping[
      "FIND_MANY_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    entity: entity,
    methodName: "findMany",
    inputObjectName: "findManyParams",
    outputObjectName: `stream ${pascalCase(entity.name)}`,
  },
  {
    methodId: templateMapping[
      "FIND_ONE_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    entity: entity,
    methodName: "findOne",
    inputObjectName: `${pascalCase(entity.name)}WhereUniqueInput`,
    outputObjectName: pascalCase(entity.name),
  },
  {
    methodId: templateMapping[
      "UPDATE_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    entity: entity,
    methodName: "update",
    inputObjectName: `${pascalCase(entity.name)}UpdateInput`,
    outputObjectName: pascalCase(entity.name),
  },
  {
    methodId: templateMapping[
      "DELETE_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    entity: entity,
    methodName: "delete",
    inputObjectName: `${pascalCase(entity.name)}WhereUniqueInput`,
    outputObjectName: pascalCase(entity.name),
  },
];

export const methodMessages = (entityName: string): methodMessage[] => [
  {
    name: `${pascalCase(entityName)}CreateInput`,
    enumMessageType: EnumMessageType.Create,
  },
  {
    name: pascalCase(entityName),
    enumMessageType: EnumMessageType.EntityObject,
  },
  {
    name: `${pascalCase(entityName)}WhereUniqueInput`,
    enumMessageType: EnumMessageType.EntityWhereInput,
  },
  {
    name: `${pascalCase(entityName)}UpdateInput`,
    enumMessageType: EnumMessageType.EntityUpdateInput,
  },
  {
    name: "findManyParams",
    enumMessageType: EnumMessageType.Empty, //an empty message
  },
];

export const manyRelationMethodMessages = (
  entityName: string
): methodMessage[] => [
  {
    name: pascalCase(entityName),
    enumMessageType: EnumMessageType.RelatedEntityObject,
  },
  {
    name: `${pascalCase(entityName)}WhereUniqueInput`,
    enumMessageType: EnumMessageType.RelatedEntityWhereInputObject,
  },
  {
    name: `${pascalCase(entityName)}Params`,
    enumMessageType: EnumMessageType.CombineWhereUniqInput,
  },
];

export const controllerToManyMethodsIdsActionPairs = (
  relatedEntity: Entity,
  fieldName: string,
  entityName?: string
): MethodsIdsActionEntity[] => [
  {
    methodName: `findMany${pascalCase(fieldName)}`,
    inputObjectName: `${entityName}WhereUniqueInput`,
    outputObjectName: `stream ${relatedEntity.name}`,
  },
  {
    methodName: `update${pascalCase(fieldName)}`,
    inputObjectName: `${relatedEntity.name}Params`,
    outputObjectName: `stream ${pascalCase(relatedEntity.name)}`,
  },
  {
    methodName: `connect${pascalCase(fieldName)}`,
    inputObjectName: `${relatedEntity.name}Params`,
    outputObjectName: relatedEntity.name,
  },
  {
    methodName: `disconnect${pascalCase(fieldName)}`,
    inputObjectName: `${relatedEntity.name}Params`,
    outputObjectName: relatedEntity.name,
  },
];

export const controllerToManyIdsActionPairs = (
  toManyMapping: { [key: string]: namedTypes.Identifier },
  fieldName: string
): ControllersIdsActionEntity[] => [
  {
    methodId: toManyMapping["FIND_MANY"],
    methodName: `findMany${pascalCase(fieldName)}`,
  },
  {
    methodId: toManyMapping["UPDATE"],
    methodName: `update${pascalCase(fieldName)}`,
  },
  {
    methodId: toManyMapping["CONNECT"],
    methodName: `connect${pascalCase(fieldName)}`,
  },
  {
    methodId: toManyMapping["DISCONNECT"],
    methodName: `disconnect${pascalCase(fieldName)}`,
  },
];
