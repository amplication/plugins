import { EntityField, EnumDataType } from "@amplication/code-gen-types";

export function isPasswordField(field: EntityField): boolean {
  return field.dataType === EnumDataType.Password;
}
