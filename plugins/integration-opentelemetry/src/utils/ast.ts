import { namedTypes, builders } from "ast-types";
import { groupBy, mapValues, uniqBy } from "lodash";
import { partialParse, print } from "@amplication/code-gen-utils";

export class ParseError extends SyntaxError {
  constructor(message: string, source: string) {
    super(`${message}\nSource:\n${source}`);
  }
}

/**
 * Consolidate import declarations to a valid minimal representation
 * @todo handle multiple local imports
 * @todo handle multiple namespace, default
 * @param declarations import declarations to consolidate
 * @returns consolidated array of import declarations
 */
function consolidateImports(
  declarations: namedTypes.ImportDeclaration[]
): namedTypes.ImportDeclaration[] {
  const moduleToDeclarations = groupBy(
    declarations,
    (declaration) => declaration.source.value
  );
  const moduleToDeclaration = mapValues(
    moduleToDeclarations,
    (declarations, module) => {
      const specifiers = uniqBy(
        declarations.flatMap((declaration) => declaration.specifiers || []),
        (specifier) => {
          if (namedTypes.ImportSpecifier.check(specifier)) {
            return specifier.imported.name;
          }
          return specifier.type;
        }
      );
      return builders.importDeclaration(
        specifiers,
        builders.stringLiteral(module)
      );
    }
  );
  return Object.values(moduleToDeclaration);
}

/**
 * Extract all the import declarations from given file
 * @param file file AST representation
 * @returns array of import declarations ast nodes
 */
export function extractImportDeclarations(
  file: namedTypes.File
): namedTypes.ImportDeclaration[] {
  const newBody = [];
  const imports = [];
  for (const statement of file.program.body) {
    if (namedTypes.ImportDeclaration.check(statement)) {
      imports.push(statement);
    } else {
      newBody.push(statement);
    }
  }
  file.program.body = newBody;
  return imports;
}

export function importNames(
  names: namedTypes.Identifier[],
  source: string
): namedTypes.ImportDeclaration {
  return builders.importDeclaration(
    names.map((name) => builders.importSpecifier(name)),
    builders.stringLiteral(source)
  );
}

export function addImports(
  file: namedTypes.File,
  imports: namedTypes.ImportDeclaration[]
): void {
  const existingImports = extractImportDeclarations(file);
  const consolidatedImports = consolidateImports([
    ...existingImports,
    ...imports,
  ]);
  file.program.body.unshift(...consolidatedImports);
}

export const callExpression = typedExpression(namedTypes.CallExpression);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function typedExpression<T>(type: { check(v: any): v is T }) {
  return (
    strings: TemplateStringsArray,
    ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>
  ): T => {
    const exp = expression(strings, ...values);
    if (!type.check(exp)) {
      throw new Error(`Code must define a single ${type} at the top level`);
    }
    return exp;
  };
}

export function expression(
  strings: TemplateStringsArray,
  ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>
): namedTypes.Expression {
  const stat = statement(strings, ...values);
  if (!namedTypes.ExpressionStatement.check(stat)) {
    throw new Error(
      "Code must define a single statement expression at the top level"
    );
  }
  return stat.expression;
}

export function statement(
  strings: TemplateStringsArray,
  ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>
): namedTypes.Statement {
  const code = codeTemplate(strings, ...values);
  const file = partialParse(code);
  if (file.program.body.length !== 1) {
    throw new Error("Code must have exactly one statement");
  }
  const [firstStatement] = file.program.body;
  return firstStatement;
}

function codeTemplate(
  strings: TemplateStringsArray,
  ...values: Array<namedTypes.ASTNode | namedTypes.ASTNode[] | string>
): string {
  return strings
    .flatMap((string, i) => {
      const value = values[i];
      if (typeof value === "string") return [string, value];
      return [
        string,
        Array.isArray(value)
          ? value.map((item) => print(item).code).join("")
          : print(value).code,
      ];
    })
    .join("");
}
