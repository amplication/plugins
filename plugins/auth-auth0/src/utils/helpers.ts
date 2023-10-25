import { Entity, EntityField } from "@amplication/code-gen-types";

export function pascalCase(str: string): string {
  return str
    .replace(/^[a-z]/, (m) => m.toUpperCase())
    .replace(/-([a-z])/g, (m) => m[1].toUpperCase());
}

export function createEnumName(field: EntityField, entity: Entity): string {
  return `Enum${pascalCase(entity.name)}${pascalCase(field.name)}`;
}
