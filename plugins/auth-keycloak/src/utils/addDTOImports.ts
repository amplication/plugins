import { namedTypes, builders } from "ast-types";
import { relativeImportPath } from "./module";
import { DTOs, DsgContext } from "@amplication/code-gen-types";
import { toCamelCase } from "js-convert-case";

export function getDTONameToPath(
  context: DsgContext,
  dtos: DTOs,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(dtos).flatMap(([entityName, entityDTOs]) =>
      Object.values(entityDTOs).map((dto) => [
        dto.id.name,
        createDTOModulePath(context, toCamelCase(entityName), dto.id.name),
      ]),
    ),
  );
}

export function getImportableDTOs(
  modulePath: string,
  dtoNameToPath: Record<string, string>,
): Record<string, namedTypes.Identifier[]> {
  return Object.fromEntries(
    Object.entries(dtoNameToPath)
      .filter(([, path]) => path !== modulePath)
      .map(([dtoName, path]) => {
        return [
          relativeImportPath(modulePath, path),
          [builders.identifier(dtoName)],
        ];
      }),
  );
}

export function createDTOModulePath(
  context: DsgContext,
  entityDirectory: string,
  dtoName: string,
): string {
  const { serverDirectories } = context;
  return `${serverDirectories.srcDirectory}/${entityDirectory}/base/${dtoName}.ts`;
}
