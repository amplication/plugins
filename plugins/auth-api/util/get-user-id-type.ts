import {
  DsgContext,
  Entity,
  EntityField,
  types,
} from "@amplication/code-gen-types";

export const getUserIdType = (dsgContext: DsgContext) => {
  const { entities } = dsgContext;
  const userEntity = entities?.find(
    (entity: Entity) => entity.name === "User" // should be fixed and use the context after publishing the new version of code-gen-types
  );

  if (!userEntity) {
    throw new Error("User entity not found");
  }

  const idField = userEntity.fields.find(
    (field: EntityField) => field.dataType === "Id" // should be fixed moving dataTypes to a shared package
  );
  if (!idField) {
    throw new Error("User entity must have an id field");
  }

  const { idType } = idField.properties as types.Id;
  return idType ?? "CUID";
};
