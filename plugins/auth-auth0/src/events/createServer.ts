import { CreateServerParams, DsgContext } from "@amplication/code-gen-types";

export const beforeCreateServer = (
  context: DsgContext,
  eventParams: CreateServerParams,
): CreateServerParams => {
  const authEntity = context.entities?.find(
    (x) => x.name === context.resourceInfo?.settings.authEntityName,
  );

  if (!authEntity) {
    throw new Error("Auth entity not found");
  }

  console.log("beforeCreateServer", authEntity);

  // Remove password field from auth entity if added automatically by auth-core plugin
  // TODO: Remove this when auth-core plugin is fixed
  authEntity.fields = authEntity.fields.filter(
    (field) => field.permanentId !== "USER_PASSWORD_FIELD_PERMANENT_ID",
  );

  console.log("beforeCreateServer", authEntity);

  return eventParams;
};