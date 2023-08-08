import { DsgContext, EntityField, types } from "@amplication/code-gen-types";
import { AUTH_ENTITY_ERROR } from "../constants";

export const getUserIdType = (dsgContext: DsgContext) => {
  const { entities, resourceInfo } = dsgContext;
  const authEntity = entities?.find(
    (x) => x.name === resourceInfo?.settings.authEntityName
  );

  if (!authEntity) {
    dsgContext.logger.error(AUTH_ENTITY_ERROR);
    throw new Error(AUTH_ENTITY_ERROR);
  }

  const idField = authEntity.fields.find(
    (field: EntityField) => field.dataType === "Id" // should be fixed moving dataTypes to a shared package
  );
  if (!idField) {
    throw new Error("User entity must have an id field");
  }

  const { idType } = idField.properties as types.Id;
  return idType ?? "CUID";
};
