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
};

type MethodsIdsActionEntity = {
  methodId: namedTypes.Identifier;
  methodName: string;
  inputObjectName: string;
  outputObjectName: string;
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
  },
  {
    name: pascalCase(entityName),
  },
  {
    name: `${pascalCase(entityName)}WhereUniqueInput`,
  },
  {
    name: `${pascalCase(entityName)}UpdateInput`,
  },
];

export const manyRelationMethodMessages = (
  entityName: string
): methodMessage[] => [
  {
    name: pascalCase(entityName),
  },
  {
    name: `${pascalCase(entityName)}WhereUniqueInput`,
  },

  //add here the empty message and findMany 
];

export const controllerToManyMethodsIdsActionPairs = (
  relatedEntity: Entity,
  entityName?: string
): MethodsIdsActionEntity[] => [
  {
    methodId: builders.identifier(
      `findMany${pascalCase(relatedEntity.pluralName)}`
    ),
    methodName: `findMany${pascalCase(relatedEntity.pluralName)}`,
    inputObjectName: `${entityName}WhereUniqueInput`,
    outputObjectName: `stream ${relatedEntity.name}`,
  },
  {
    methodId: builders.identifier(
      `update${pascalCase(relatedEntity.pluralName)}`
    ),
    methodName: `update${pascalCase(relatedEntity.pluralName)}`,
    inputObjectName: `${relatedEntity.name}Params`,
    outputObjectName: `stream ${pascalCase(relatedEntity.name)}`,
  },
  {
    methodId: builders.identifier(
      `connect${pascalCase(relatedEntity.pluralName)}`
    ),
    methodName: `connect${pascalCase(relatedEntity.pluralName)}`,
    inputObjectName:`${relatedEntity.name}Params`,
    outputObjectName: relatedEntity.name,
  },
  {
    methodId: builders.identifier(
      `disconnect${pascalCase(relatedEntity.pluralName)}`
    ),
    methodName: `disconnect${pascalCase(relatedEntity.pluralName)}`,
    inputObjectName: `${relatedEntity.name}Params`,
    outputObjectName: relatedEntity.name,
  },
];
