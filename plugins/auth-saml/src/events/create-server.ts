import { DsgContext, CreateServerParams } from "@amplication/code-gen-types";
import { beforeCreateServer as authCoreBeforeCreateServer } from "@amplication/auth-core";
import {
  AUTH_ENTITY_FIELD_USERNAME,
  AUTH_ENTITY_FIELD_SESSION_ID,
} from "../constants";

export function beforeCreateServer(
  context: DsgContext,
  eventParams: CreateServerParams,
) {
  eventParams = authCoreBeforeCreateServer(context, eventParams);

  const authEntity = context.entities?.find(
    (x) => x.name === context.resourceInfo?.settings.authEntityName,
  );
  if (!authEntity) {
    throw new Error(`Authentication entity does not exist`);
  }

  const requiredFields = [
    AUTH_ENTITY_FIELD_USERNAME,
    AUTH_ENTITY_FIELD_SESSION_ID,
  ];

  requiredFields.forEach((requiredField) => {
    const field = authEntity.fields.find(
      (field) => field.name === requiredField,
    );
    if (!field) {
      throw new Error(
        `Authentication entity must have a field named ${requiredField}`,
      );
    }
  });

  return eventParams;
}
