import {
  PluginInstallation,
  VariableDictionary,
} from "@amplication/code-gen-types";
import { namedTypes, ASTNode } from "ast-types";
import * as recast from "recast";
import { parse } from "@amplication/code-gen-utils";
import { name as PackageName } from "../package.json";
import { Settings } from "./types";
import { settings as defaultSettings } from "../.amplicationrc.json";
import { builders } from "ast-types";
import * as K from "ast-types/gen/kinds";
import { NodePath } from "ast-types/lib/node-path";
import { groupBy, mapValues, uniqBy } from "lodash";

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

export const prettyCode = (code: string): string => {
  return recast.prettyPrint(parse(code)).code;
};

export const settingToEnvVar = (
  settingKey: keyof Settings
): string | undefined => {
  const prefix = "SUPERTOKENS";
  const mapping: { [key in keyof Settings]?: string } = {
    apiBasePath: `${prefix}_API_BASE_PATH`,
    apiDomain: `${prefix}_API_DOMAIN`,
    appName: `${prefix}_APP_NAME`,
    apiGatewayPath: `${prefix}_API_GATEWAY_PATH`,
    connectionUri: `${prefix}_CONNECTION_URI`,
    websiteBasePath: `${prefix}_WEBSITE_BASE_PATH`,
    websiteDomain: `${prefix}_WEBSITE_DOMAIN`,
    apiKey: `${prefix}_API_KEY`,
  };
  return mapping[settingKey];
};

export const settingsToVarDict = (settings: Settings): VariableDictionary => {
  return Object.keys(settings)
    .map((settingKey) => {
      const envVar = settingToEnvVar(settingKey as keyof Settings);
      if (envVar) {
        return {
          [envVar]: settings[settingKey as keyof Settings]!.toString(),
        };
      }
      return {};
    })
    .filter((envVar) => Object.keys(envVar).length !== 0);
};

export const varDictToReactEnvVars = (
  varDict: VariableDictionary
): VariableDictionary => {
  return varDict.map((val) => {
    const envName = Object.keys(val)[0];
    return { [`REACT_APP_${envName}`]: val[envName] };
  });
};

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
