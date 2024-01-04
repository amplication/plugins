import { Entity, EntityField, EnumDataType } from "@amplication/code-gen-types";
import { EmailError, placeholders } from "../constants";
import { IRecipe } from "../types";
import { Settings } from "../types";
import { toPascalCase } from "js-convert-case";

export function createEnumName(field: EntityField, entity: Entity): string {
  return `Enum${toPascalCase(entity.name)}${toPascalCase(field.name)}`;
}

export const getSearchableAuthField = (
  entity: Entity,
  recipe: IRecipe,
): EntityField => {
  const { emailFieldName, payloadFieldMapping } = recipe;
  const payloadEmailField = Object.keys(payloadFieldMapping || {}).find(
    (key) => payloadFieldMapping?.[key] === "email",
  );
  const fallbackEmailField = entity?.fields?.find(
    (field) => field.dataType === EnumDataType.Email,
  );

  if (
    emailFieldName &&
    !entity.fields.find(
      (field) =>
        field.name === emailFieldName && field.dataType === EnumDataType.Email,
    )
  ) {
    throw new Error(EmailError(entity.name, emailFieldName, "emailFieldName"));
  } else if (
    !emailFieldName &&
    payloadEmailField &&
    !entity.fields.find(
      (field) =>
        field.name === payloadEmailField &&
        field.dataType === EnumDataType.Email,
    )
  ) {
    throw new Error(
      EmailError(entity.name, payloadEmailField || "", "payloadFieldMapping"),
    );
  } else if (!emailFieldName && !payloadFieldMapping && !fallbackEmailField) {
    throw new Error(
      `The entity ${entity.name} does not have a field with the data type ${EnumDataType.Email}`,
    );
  }

  const authEmailField = entity.fields.find(
    (field) =>
      field.name ===
      (emailFieldName || payloadEmailField || fallbackEmailField?.name),
  );

  if (!authEmailField) {
    throw new Error(
      `The Auth entity ${entity.name} does not have a field named ${
        emailFieldName || payloadEmailField || fallbackEmailField?.name
      }`,
    );
  }
  if (authEmailField?.unique === false)
    throw new Error(
      `The field ${authEmailField.name} in the entity ${entity.name} must be unique`,
    );
  else if (authEmailField?.searchable === false)
    throw new Error(
      `The field ${authEmailField.name} in the entity ${entity.name} must be searchable`,
    );

  return authEmailField;
};

export const getRealmConfig = (settings: Settings): Record<string, unknown> => {
  const defaults = {
    port: 8080,
    realmID: "amplication-sample-realm",
    realmName: "Amplication Sample Realm",
    clientID: "amplication-server",
    clientName: "Amplication Server",
    clientDescription: "Sample client for Amplication Server",
  };

  const mapping = Object.entries(placeholders).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [value]:
        settings[key as keyof Settings]?.toString() ||
        defaults[key as keyof typeof defaults],
    }),
    {},
  );
  return mapping;
};
