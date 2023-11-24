/**
 * @Amplication example constants file.
 * Add all your constants here.
 */
import {
  EntityField,
  EntityLookupField,
  EnumDataType,
  types,
} from "@amplication/code-gen-types";

export function isRelationField(
  field: EntityField,
): field is EntityLookupField {
  return field.dataType === EnumDataType.Lookup;
}

export function isOneToOneRelationField(
  field: EntityField,
): field is EntityLookupField {
  if (!isRelationField(field)) {
    return false;
  }
  const properties = field.properties as types.Lookup;
  return !properties.allowMultipleSelection;
}

export function isToManyRelationField(
  field: EntityField,
): field is EntityLookupField {
  return isRelationField(field) && !isOneToOneRelationField(field);
}
