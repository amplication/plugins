import {
  DsgContext,
  CreateEntityResolverToOneRelationMethodsParams,
  EnumEntityAction,
} from "@amplication/code-gen-types";
import { namedTypes } from "ast-types";
import { EnumTemplateType } from "../core/create-method-id-action-entity-map";
import { interpolate, getClassDeclarationById } from "../util/ast";
import { setAuthPermissions } from "../util/set-endpoint-permissions";
import { TO_MANY_MIXIN_ID } from "../constants";

export function beforeCreateEntityResolverToOneRelationMethods(
  context: DsgContext,
  eventParams: CreateEntityResolverToOneRelationMethodsParams
) {
  const relatedEntity = eventParams.field.properties?.relatedEntity;

  interpolate(eventParams.toOneFile, eventParams.toOneMapping);

  const classDeclaration = getClassDeclarationById(
    eventParams.toOneFile,
    TO_MANY_MIXIN_ID
  );

  setAuthPermissions(
    classDeclaration,
    eventParams.toOneMapping["FIND_ONE"] as namedTypes.Identifier,
    EnumEntityAction.View,
    relatedEntity.name,
    false,
    EnumTemplateType.ResolverFindOne,
    relatedEntity.permissions.find((p) => p.action === EnumEntityAction.View)
      ?.type
  );

  return eventParams;
}
