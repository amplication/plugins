import { DsgContext, CreateServerParams } from "@amplication/code-gen-types";
import { AUTH_ENTITY_FIELD_ROLES } from "../constants";

export function beforeCreateServer(
  context: DsgContext,
  eventParams: CreateServerParams
) {
  const authEntity = context.entities?.find(
    (x) => x.name === context.resourceInfo?.settings.authEntityName
  );
  if (!authEntity) {
    throw new Error(`Authentication entity does not exist`);
  }

  const authEntityFieldRoles = authEntity.fields.find(
    (x) => x.name === AUTH_ENTITY_FIELD_ROLES
  );

  if (!authEntityFieldRoles) {
    throw new Error(
      `Authentication entity does not have a field named ${AUTH_ENTITY_FIELD_ROLES}`
    );
  }

  return eventParams;
}
