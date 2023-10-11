import * as recast from "recast";
import { ASTNode, namedTypes, builders } from "ast-types";
import { NodePath } from "ast-types/lib/node-path";
import * as K from "ast-types/gen/kinds";
import { groupBy, mapValues, uniqBy } from "lodash";
export { prettyPrint } from "recast";
import { parse } from "@amplication/code-gen-utils"
export * from "@amplication/code-gen-utils"

/**
 * Finds class declaration in provided AST node, if no class is found throws an exception
 * @param node AST node which includes the desired class declaration
 * @param id the identifier of the desired class
 * @returns a class declaration with a matching identifier to the one given in the given AST node
 */
export function getClassDeclarationById(
  node: ASTNode,
  id: namedTypes.Identifier
): namedTypes.ClassDeclaration {
  let classDeclaration: namedTypes.ClassDeclaration | null = null;
  recast.visit(node, {
    visitClassDeclaration(path) {
      if (path.node.id && path.node.id.name === id.name) {
        classDeclaration = path.node;
        return false;
      }
      return this.traverse(path);
    },
  });

  if (!classDeclaration) {
    throw new Error(
      `Could not find class declaration with the identifier ${id.name} in provided AST node`
    );
  }

  return classDeclaration;
}

export function getFunctionDeclarationById(
  node: ASTNode,
  id: namedTypes.Identifier
): namedTypes.FunctionDeclaration {
  let functionDeclaration: namedTypes.FunctionDeclaration | null = null;
  recast.visit(node, {
    visitFunctionDeclaration(path) {
      if (path.node.id && path.node.id.name === id.name) {
        functionDeclaration = path.node;
        return false;
      }
      return this.traverse(path);
    },
  });

  if (!functionDeclaration) {
    throw new Error(
      `Could not find function declaration with the identifier ${id.name} in provided AST node`
    );
  }

  return functionDeclaration;
}

export const prettyCode = (code: string): string => {
  return recast.prettyPrint(parse(code)).code
}
/**
 * In given AST replaces identifiers with AST nodes according to given mapping
 * @param ast AST to replace identifiers in
 * @param mapping from identifier to AST node to replace it with
 */
export function interpolate(
  ast: ASTNode,
  mapping: { [key: string]: ASTNode | undefined }
): void {
  return recast.visit(ast, {
    visitIdentifier(path) {
      const { name } = path.node;
      if (mapping.hasOwnProperty(name)) {
        const replacement = mapping[name];
        path.replace(replacement);
      }
      this.traverse(path);
    },
    // Recast has a bug of traversing class decorators
    // This method fixes it
    visitClassDeclaration(path) {
      const childPath = path.get("decorators");
      if (childPath.value) {
        this.traverse(childPath);
      }
      return this.traverse(path);
    },
    // Recast has a bug of traversing class property decorators
    // This method fixes it
    visitClassProperty(path) {
      const childPath = path.get("decorators");
      if (childPath.value) {
        this.traverse(childPath);
      }
      this.traverse(path);
    },
    // Recast has a bug of traversing TypeScript call expression type parameters
    visitCallExpression(path) {
      const childPath = path.get("typeParameters");
      if (childPath.value) {
        this.traverse(childPath);
      }
      this.traverse(path);
    },
    /**
     * Template literals that only hold identifiers mapped to string literals
     * are statically evaluated to string literals.
     * @example
     * ```
     * const file = parse("`Hello, ${NAME}!`");
     * interpolate(file, { NAME: builders.stringLiteral("World") });
     * print(file).code === '"Hello, World!"';
     * ```
     */
    visitTemplateLiteral(path) {
      const canTransformToStringLiteral = path.node.expressions.every(
        (expression) =>
          namedTypes.Identifier.check(expression) &&
          expression.name in mapping &&
          namedTypes.StringLiteral.check(mapping[expression.name])
      );
      if (canTransformToStringLiteral) {
        path.node.expressions = path.node.expressions.map((expression) => {
          const identifier = expression as namedTypes.Identifier;
          return mapping[identifier.name] as namedTypes.StringLiteral;
        });
        path.replace(transformTemplateLiteralToStringLiteral(path.node));
      }
      this.traverse(path);
    },
    visitJSXElement(path) {
      evaluateJSX(path, mapping);
      this.traverse(path);
    },
    visitJSXFragment(path) {
      evaluateJSX(path, mapping);
      this.traverse(path);
    },
  });
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

export function transformTemplateLiteralToStringLiteral(
  templateLiteral: namedTypes.TemplateLiteral
): namedTypes.StringLiteral {
  const value = templateLiteral.quasis
    .map((quasie, i) => {
      const expression = templateLiteral.expressions[
        i
      ] as namedTypes.StringLiteral;
      if (expression) {
        return quasie.value.raw + expression.value;
      }
      return quasie.value.raw;
    })
    .join("");
  return builders.stringLiteral(value);
}

export function evaluateJSX(
  path: NodePath,
  mapping: { [key: string]: ASTNode | undefined }
): void {
  const childrenPath = path.get("children");
  childrenPath.each(
    (
      childPath: NodePath<
        | K.JSXTextKind
        | K.JSXExpressionContainerKind
        | K.JSXSpreadChildKind
        | K.JSXElementKind
        | K.JSXFragmentKind
        | K.LiteralKind
      >
    ) => {
      const { node } = childPath;
      if (
        namedTypes.JSXExpressionContainer.check(node) &&
        namedTypes.Identifier.check(node.expression)
      ) {
        const { expression } = node;
        const mapped = mapping[expression.name];
        if (namedTypes.JSXElement.check(mapped)) {
          childPath.replace(mapped);
        } else if (namedTypes.StringLiteral.check(mapped)) {
          childPath.replace(builders.jsxText(mapped.value));
        } else if (namedTypes.JSXFragment.check(mapped) && mapped.children) {
          childPath.replace(...mapped.children);
        }
      }
    }
  );
}
