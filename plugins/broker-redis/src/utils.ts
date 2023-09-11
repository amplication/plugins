import { PluginInstallation, VariableDictionary } from "@amplication/code-gen-types";
import { name as PackageName } from "../package.json";
import { Settings } from "./types";
import { settings as defaultSettings }  from "../.amplicationrc.json";
import { namedTypes, ASTNode, builders } from "ast-types";
import { NodePath } from "ast-types/lib/node-path";
import * as K from "ast-types/gen/kinds";
import * as recast from "recast";
import { parse } from "@amplication/code-gen-utils"
export * from "@amplication/code-gen-utils"
export { prettyPrint } from "recast";

export const getPluginSettings = (
  pluginInstallations: PluginInstallation[]
): Settings => {
  const plugin = pluginInstallations.find(
    (plugin) => plugin.npm === PackageName
  );

  const userSettings = plugin?.settings ?? {};

  const settings: Settings = {
    ...defaultSettings,
    ...userSettings,
  };

  return settings;
};

export const settingToEnvVar = (settingKey: keyof Settings): string => {
  const mapping: {[key in keyof Settings]: string} = {
    host: "REDIS_BROKER_HOST",
    port: "REDIS_BROKER_PORT",
    retryAttempts: "REDIS_BROKER_RETRY_ATTEMPTS",
    retryDelay: "REDIS_BROKER_RETRY_DELAY",
    enableTls: "REDIS_BROKER_ENABLE_TLS"
  }
  return mapping[settingKey]
}

export const settingsToVarDict = (settings: Settings): VariableDictionary => {
  return Object.keys(settings)
      .map((settingKey) => ({
          [settingToEnvVar(settingKey as keyof Settings)]:
            settings[settingKey as keyof Settings]?.toString()
      }))
      .filter((obj) => {
        const key = Object.keys(obj)[0];
        // To filter out unexpected settings that don't map to
        // environment variables
        return key !== "undefined" &&
          obj[key] !== undefined && obj[key] !== null
      })
      // Added this last map to get rid of typescript errors
      .map((obj) => {
        const key = Object.keys(obj)[0]
        return { [key]: obj[key]! }
      })
}

export const removeSemicolon = (stmt: string) => {
  if(stmt.length === 0) {
    throw new Error("This isn't a statement")
  }
  if(stmt[stmt.length - 1] !== ";") {
    throw new Error("This statement doesn't end in a semicolon. No semicolon to remove")
  }
  return stmt.slice(0, -1);
}

export const prettyCode = (code: string): string => {
    return recast.prettyPrint(parse(code)).code
}

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
        functionDeclaration = path.node as namedTypes.FunctionDeclaration;
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
        (expression: any) =>
          namedTypes.Identifier.check(expression) &&
          expression.name in mapping &&
          namedTypes.StringLiteral.check(mapping[expression.name])
      );
      if (canTransformToStringLiteral) {
        path.node.expressions = path.node.expressions.map((expression) => {
          const identifier = expression as namedTypes.Identifier;
          return mapping[identifier.name] as namedTypes.StringLiteral;
        });
        path.replace(transformTemplateLiteralToStringLiteral(path.node as namedTypes.TemplateLiteral));
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


