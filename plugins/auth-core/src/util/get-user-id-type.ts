import {
  DsgContext,
  Entity,
  EntityField,
  types,
} from "@amplication/code-gen-types";

export const getUserIdType = (dsgContext: DsgContext) => {
  const { entities, resourceInfo } = dsgContext;
  const authEntity = entities?.find(
    (x) => x.name === resourceInfo?.settings.authEntityName
  );

  if (!authEntity) {
    throw new Error("User entity not found");
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
