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
    inputObjectName: `${pascalCase(entity.name)}CreateInput`,
    outputObjectName: pascalCase(entity.name),
  },
  {
    methodId: templateMapping[
      "FIND_MANY_ENTITY_FUNCTION"
    ] as namedTypes.Identifier,
    entity: entity,
    methodName: "findMany",
    inputObjectName: ``,
    outputObjectName: `${pascalCase(entity.name)}[]`,
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
