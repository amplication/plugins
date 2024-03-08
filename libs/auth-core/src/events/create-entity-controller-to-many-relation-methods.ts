import {
  DsgContext,
  CreateEntityControllerToManyRelationMethodsParams,
} from "@amplication/code-gen-types";
import {
  controllerToManyMethodsIdsActionPairs,
  EnumTemplateType,
} from "../core/create-method-id-action-entity-map";
import { interpolate, getClassDeclarationById } from "../util/ast";
import { setAuthPermissions } from "../util/set-endpoint-permissions";
import { TO_MANY_MIXIN_ID } from "../constants";

export function beforeCreateEntityControllerToManyRelationMethods(
  context: DsgContext,
  eventParams: CreateEntityControllerToManyRelationMethodsParams
) {
  const relatedEntity = eventParams.field.properties?.relatedEntity;

  interpolate(eventParams.toManyFile, eventParams.toManyMapping);

  const toManyClassDeclaration = getClassDeclarationById(
    eventParams.toManyFile,
    TO_MANY_MIXIN_ID
  );

  controllerToManyMethodsIdsActionPairs(
    eventParams.toManyMapping,
    eventParams.entity,
    relatedEntity
  ).forEach(({ methodId, action, entity, permissionType }) => {
    setAuthPermissions(
      toManyClassDeclaration,
      methodId,
      action,
      entity.name,
      true,
      EnumTemplateType.controllerToManyMethods,
      permissionType
    );
  });

  return eventParams;
}
