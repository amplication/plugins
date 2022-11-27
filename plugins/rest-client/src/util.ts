import { namedTypes } from "ast-types";
import normalize from "normalize-path";
import path from "path";
import { parse as recastParse, visit } from "recast";

const JSON_EXT = ".json";

export function parse(content: string): namedTypes.File {
  return recastParse(content, {
    parser: require("recast/parsers/typescript"),
    tolerant: true,
  });
}

export function getFistClassInFile(
  astNode: namedTypes.ASTNode
): Promise<namedTypes.ClassDeclaration> {
  return new Promise((res, rej) => {
    visit(astNode, {
      visitClassDeclaration: (path) => {
        res(path.value);
      },
    });
  });
}

/**
 * @param from filePath of the module to import from
 * @param to filePath of the module to import to
 */
export function relativeImportPath(from: string, to: string): string {
  const relativePath = path.relative(path.dirname(from), to);
  return filePathToModulePath(relativePath);
}

/**
 * @param filePath path to the file to import
 * @returns module path of the given file path
 */
export function filePathToModulePath(filePath: string): string {
  const parsedPath = path.parse(filePath);
  const fixedExtPath =
    parsedPath.ext === JSON_EXT
      ? filePath
      : path.join(parsedPath.dir, parsedPath.name);
  const normalizedPath = normalize(fixedExtPath);
  return normalizedPath.startsWith("/") || normalizedPath.startsWith(".")
    ? normalizedPath
    : "./" + normalizedPath;
}
