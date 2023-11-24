import { visit } from "recast";
import * as path from "path";
import normalize from "normalize-path";
import { groupBy, mapValues, uniqBy } from "lodash";
import { ASTNode, namedTypes, builders } from "ast-types";
import * as K from "ast-types/gen/kinds";
import { NodePath } from "ast-types/lib/node-path";

const CONSTRUCTOR_NAME = "constructor";
const JSON_EXT = ".json";
const TS_IGNORE_TEXT = "@ts-ignore";

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

export function relativeImportPath(from: string, to: string): string {
  const relativePath = path.relative(path.dirname(from), to);
  return filePathToModulePath(relativePath);
}

/**
 * Extract all the import declarations from given file
 * @param file file AST representation
 * @returns array of import declarations ast nodes
 */
export function extractImportDeclarations(
  file: namedTypes.File,
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

/**
 * Consolidate import declarations to a valid minimal representation
 * @todo handle multiple local imports
 * @todo handle multiple namespace, default
 * @param declarations import declarations to consolidate
 * @returns consolidated array of import declarations
 */
function consolidateImports(
  declarations: namedTypes.ImportDeclaration[],
): namedTypes.ImportDeclaration[] {
  const moduleToDeclarations = groupBy(
    declarations,
    (declaration) => declaration.source.value,
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
        },
      );
      return builders.importDeclaration(
        specifiers,
        builders.stringLiteral(module),
      );
    },
  );
  return Object.values(moduleToDeclaration);
}

export function addImports(
  file: namedTypes.File,
  imports: namedTypes.ImportDeclaration[],
): void {
  const existingImports = extractImportDeclarations(file);
  const consolidatedImports = consolidateImports([
    ...existingImports,
    ...imports,
  ]);
  file.program.body.unshift(...consolidatedImports);
}

export function removeDecoratorByName(
  node: ASTNode,
  decoratorName: string,
): boolean {
  let decorator: namedTypes.ClassDeclaration | null = null;
  visit(node, {
    visitDecorator(path) {
      const callee = path.get("expression", "callee");
      if (callee.value && callee.value.property?.name === decoratorName) {
        decorator = path.value;
        path.prune();
      }
      return this.traverse(path);
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
  });

  if (!decorator) {
    return false;
  }

  return true;
}

/**
 * Returns the constructor of the given classDeclaration
 * @param classDeclaration
 */
export function findConstructor(
  classDeclaration: namedTypes.ClassDeclaration,
): namedTypes.ClassMethod | undefined {
  return classDeclaration.body.body.find(
    (member): member is namedTypes.ClassMethod =>
      namedTypes.ClassMethod.check(member) && isConstructor(member),
  );
}

/**
 * Returns the first decorator with a specific name from the given AST
 * @param ast the AST to return the decorator from
 */
export function findFirstDecoratorByName(
  node: ASTNode,
  decoratorName: string,
): namedTypes.Decorator {
  let decorator: namedTypes.ClassDeclaration | null = null;
  visit(node, {
    visitDecorator(path) {
      const callee = path.get("expression", "callee");
      if (callee.value && callee.value.name === decoratorName) {
        decorator = path.value;
        return false;
      }
      return this.traverse(path);
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
  });

  if (!decorator) {
    throw new Error(
      `Could not find class decorator with the name ${decoratorName} in provided AST node`,
    );
  }

  return decorator as any;
}

export function findContainedIdentifiers(
  node: ASTNode,
  identifiers: Iterable<namedTypes.Identifier>,
): namedTypes.Identifier[] {
  const nameToIdentifier = Object.fromEntries(
    Array.from(identifiers, (identifier) => [identifier.name, identifier]),
  );
  const contained: namedTypes.Identifier[] = [];
  visit(node, {
    visitIdentifier(path) {
      if (nameToIdentifier.hasOwnProperty(path.node.name)) {
        contained.push(path.node);
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
  });
  return contained;
}

export function importContainedIdentifiers(
  node: ASTNode,
  moduleToIdentifiers: Record<string, namedTypes.Identifier[]>,
): namedTypes.ImportDeclaration[] {
  const idToModule = new Map(
    Object.entries(moduleToIdentifiers).flatMap(([key, values]) =>
      values.map((value) => [value, key]),
    ),
  );
  const nameToId = Object.fromEntries(
    Array.from(idToModule.keys(), (identifier) => [
      identifier.name,
      identifier,
    ]),
  );
  const containedIds = findContainedIdentifiers(node, idToModule.keys());
  const moduleToContainedIds = groupBy(containedIds, (id) => {
    const knownId = nameToId[id.name];
    const module = idToModule.get(knownId);
    return module;
  });
  return Object.entries(moduleToContainedIds).map(([module, containedIds]) =>
    importNames(containedIds, module),
  );
}

export function transformTemplateLiteralToStringLiteral(
  templateLiteral: namedTypes.TemplateLiteral,
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

export function importNames(
  names: namedTypes.Identifier[],
  source: string,
): namedTypes.ImportDeclaration {
  return builders.importDeclaration(
    names.map((name) => builders.importSpecifier(name)),
    builders.stringLiteral(source),
  );
}

/**
 * Removes all TypeScript ignore comments
 * @param ast the AST to remove the comments from
 */
export function removeTSIgnoreComments(ast: ASTNode): void {
  visit(ast, {
    visitComment(path) {
      if (path.value.value.includes(TS_IGNORE_TEXT)) {
        path.prune();
      }
      this.traverse(path);
    },
  });
}

/**
 * Removes all TypeScript variable declares
 * @param ast the AST to remove the declares from
 */
export function removeTSVariableDeclares(ast: ASTNode): void {
  visit(ast, {
    visitVariableDeclaration(path) {
      if (path.get("declare").value) {
        path.prune();
      }
      this.traverse(path);
    },
  });
}

/**
 * Removes all ESLint comments
 * @param ast the AST to remove the comments from
 */
export function removeESLintComments(ast: ASTNode): void {
  visit(ast, {
    visitComment(path) {
      const comment = path.value as namedTypes.Comment;
      if (comment.value.match(/^\s+eslint-disable/)) {
        path.prune();
      }
      this.traverse(path);
    },
  });
}

/**
 * Removes all TypeScript interface declares
 * @param ast the AST to remove the declares from
 */
export function removeTSInterfaceDeclares(ast: ASTNode): void {
  visit(ast, {
    visitTSInterfaceDeclaration(path) {
      if (path.get("declare").value) {
        path.prune();
      }
      this.traverse(path);
    },
  });
}

/**
 * Removes all TypeScript class declares
 * @param ast the AST to remove the declares from
 */
export function removeTSClassDeclares(ast: ASTNode): void {
  visit(ast, {
    visitClassDeclaration(path) {
      if (path.get("declare").value) {
        path.prune();
      }
      this.traverse(path);
    },
  });
}

export function evaluateJSX(
  path: NodePath,
  mapping: { [key: string]: ASTNode | undefined },
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
      >,
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
    },
  );
}

export function isConstructor(method: namedTypes.ClassMethod): boolean {
  return (
    namedTypes.Identifier.check(method.key) &&
    method.key.name === CONSTRUCTOR_NAME
  );
}

export function getMethods(
  classDeclaration: namedTypes.ClassDeclaration,
): namedTypes.ClassMethod[] {
  return classDeclaration.body.body.filter(
    (member): member is namedTypes.ClassMethod =>
      namedTypes.ClassMethod.check(member) && !isConstructor(member),
  );
}

export function getClassMethodById(
  classDeclaration: namedTypes.ClassDeclaration,
  methodId: namedTypes.Identifier,
): namedTypes.ClassMethod | null {
  const allMethodWithoutConstructor = getMethods(classDeclaration);
  return (
    allMethodWithoutConstructor.find((method) => method.key === methodId) ||
    null
  );
}

/**
 * In given AST replaces identifiers with AST nodes according to given mapping
 * @param ast AST to replace identifiers in
 * @param mapping from identifier to AST node to replace it with
 */
export function interpolate(
  ast: ASTNode,
  mapping: { [key: string]: ASTNode | undefined },
): void {
  return visit(ast, {
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
          namedTypes.StringLiteral.check(mapping[expression.name]),
      );
      if (canTransformToStringLiteral) {
        path.node.expressions = path.node.expressions.map((expression) => {
          const identifier = expression as namedTypes.Identifier;
          return mapping[identifier.name] as namedTypes.StringLiteral;
        });
        path.replace(
          transformTemplateLiteralToStringLiteral(
            path.node as namedTypes.TemplateLiteral,
          ),
        );
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

/**
 * Finds class declaration in provided AST node, if no class is found throws an exception
 * @param node AST node which includes the desired class declaration
 * @param id the identifier of the desired class
 * @returns a class declaration with a matching identifier to the one given in the given AST node
 */
export function getClassDeclarationById(
  node: ASTNode,
  id: namedTypes.Identifier,
): namedTypes.ClassDeclaration {
  let classDeclaration: namedTypes.ClassDeclaration | null = null;
  visit(node, {
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
      `Could not find class declaration with the identifier ${id.name} in provided AST node`,
    );
  }

  return classDeclaration;
}
