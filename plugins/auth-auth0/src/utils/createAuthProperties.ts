import {
  Entity,
  EntityField,
  EnumDataType,
  types,
} from "@amplication/code-gen-types";
import { builders, namedTypes } from "ast-types";
import { memberExpression } from "@utils/ast";
import { createEnumName, pascalCase } from "@utils/helpers";

const DEFAULT_ADDRESS = "(32.085300, 34.781769)";
const DEFAULT_EMAIL = "example@example.com";
const DATE_ID = builders.identifier("Date");
export const DEFAULT_EMPTY_STRING_LITERAL = builders.stringLiteral("");
export const DEFAULT_ADDRESS_LITERAL = builders.stringLiteral(DEFAULT_ADDRESS);
export const DEFAULT_BOOLEAN_LITERAL = builders.booleanLiteral(false);
export const EMPTY_ARRAY_EXPRESSION = builders.arrayExpression([]);
export const DEFAULT_NUMBER_LITERAL = builders.numericLiteral(0);
export const DEFAULT_EMAIL_LITERAL = builders.stringLiteral(DEFAULT_EMAIL);
export const NEW_DATE_EXPRESSION = builders.newExpression(DATE_ID, []);
export const NEW_JSON_EXPRESSION = builders.objectExpression([
  builders.objectProperty(
    builders.stringLiteral("foo"),
    builders.stringLiteral("bar"),
  ),
]);

export const DEFAULT_USERNAME_LITERAL = builders.stringLiteral("admin");
export const DEFAULT_ROLE_LITERAL = builders.arrayExpression([
  builders.stringLiteral("user"),
]);

export function createAuthEntityObjectCustomProperties(
  authEntity: Entity,
  defaultValues: Record<string, unknown>,
): namedTypes.ObjectProperty[] {
  return authEntity.fields
    .filter((field) => field.required)
    .map((field): [EntityField, namedTypes.Expression | null] => [
      field,
      createDefaultValue(field, authEntity, defaultValues[field.name]),
    ])
    .filter(([, value]) => value)
    .map(([field, value]) =>
      builders.objectProperty(
        builders.identifier(field.name),
        // @ts-ignore
        value,
      ),
    );
}

export function createDefaultValue(
  field: EntityField,
  entity: Entity,
  defaultValue: unknown,
): namedTypes.Expression | null {
  switch (field.dataType) {
    case EnumDataType.SingleLineText:
    case EnumDataType.MultiLineText: {
      return defaultValue
        ? builders.stringLiteral(defaultValue as string)
        : DEFAULT_EMPTY_STRING_LITERAL;
    }
    case EnumDataType.Email: {
      return defaultValue
        ? builders.stringLiteral(defaultValue as string)
        : DEFAULT_EMAIL_LITERAL;
    }
    case EnumDataType.WholeNumber: {
      return defaultValue
        ? builders.numericLiteral(defaultValue as number)
        : DEFAULT_NUMBER_LITERAL;
    }
    case EnumDataType.DateTime: {
      if (defaultValue) {
        return builders.newExpression(DATE_ID, [
          builders.stringLiteral(defaultValue as string),
        ]);
      }
      return NEW_DATE_EXPRESSION;
    }
    case EnumDataType.DecimalNumber: {
      return defaultValue
        ? builders.numericLiteral(defaultValue as number)
        : DEFAULT_NUMBER_LITERAL;
    }
    case EnumDataType.MultiSelectOptionSet: {
      return EMPTY_ARRAY_EXPRESSION;
    }
    case EnumDataType.OptionSet: {
      const { options } = field.properties as types.OptionSet;
      const [firstOption] = options;
      return defaultValue
        ? memberExpression`${createEnumName(field, entity)}.${pascalCase(
            defaultValue as string,
          )}`
        : memberExpression`${createEnumName(field, entity)}.${pascalCase(
            firstOption.label,
          )}`;
    }
    case EnumDataType.Boolean: {
      return defaultValue
        ? builders.booleanLiteral(defaultValue as boolean)
        : DEFAULT_BOOLEAN_LITERAL;
    }
    case EnumDataType.GeographicLocation: {
      return defaultValue
        ? builders.stringLiteral(defaultValue as string)
        : DEFAULT_ADDRESS_LITERAL;
    }
    case EnumDataType.Json: {
      return NEW_JSON_EXPRESSION;
    }
    case EnumDataType.Id:
    case EnumDataType.CreatedAt:
    case EnumDataType.UpdatedAt:
    case EnumDataType.Password: {
      return null;
    }
    case EnumDataType.Username: {
      return defaultValue
        ? builders.stringLiteral(defaultValue as string)
        : DEFAULT_USERNAME_LITERAL;
    }
    case EnumDataType.Roles: {
      return defaultValue
        ? builders.arrayExpression(
            (defaultValue as string[]).map((item) =>
              builders.stringLiteral(item),
            ),
          )
        : DEFAULT_ROLE_LITERAL;
    }
    case EnumDataType.Lookup: {
      return null;
    }
    default: {
      throw new Error(`Unexpected data type: ${field.dataType}`);
    }
  }
}
