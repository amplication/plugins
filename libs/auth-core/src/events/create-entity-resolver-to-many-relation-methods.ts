import {
  DsgContext,
  CreateEntityResolverToManyRelationMethodsParams,
  EnumEntityAction,
} from "@amplication/code-gen-types";
import { namedTypes } from "ast-types";
import { EnumTemplateType } from "../core/create-method-id-action-entity-map";
import { interpolate, getClassDeclarationById } from "../util/ast";
import { setAuthPermissions } from "../util/set-endpoint-permissions";
import { TO_MANY_MIXIN_ID } from "../constants";

export function beforeCreateEntityResolverToManyRelationMethods(
  context: DsgContext,
  eventParams: CreateEntityResolverToManyRelationMethodsParams
) {
  const relatedEntity = eventParams.field.properties?.relatedEntity;

  interpolate(eventParams.toManyFile, eventParams.toManyMapping);

  const toManyClassDeclaration = getClassDeclarationById(
    eventParams.toManyFile,
    TO_MANY_MIXIN_ID
  );

  setAuthPermissions(
    toManyClassDeclaration,
    eventParams.toManyMapping["FIND_MANY"] as namedTypes.Identifier,
    EnumEntityAction.Search,
    relatedEntity.name,
    false,
    EnumTemplateType.ResolverToManyMethods,
    relatedEntity.permissions.find((p) => p.action === EnumEntityAction.Search)
      ?.type
  );

  return eventParams;
}
