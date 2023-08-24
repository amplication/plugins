import { PluginInstallation, VariableDictionary } from "@amplication/code-gen-types";
import { name as PackageName } from "../package.json";
import { Settings } from "./types";
import { settings as defaultSettings }  from "../.amplicationrc.json";
import { namedTypes, ASTNode } from "ast-types";
import * as recast from "recast";
import { appendImports, parse } from "@amplication/code-gen-utils"
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
    url: "REDIS_BROKER_URL",
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
        return obj[key] !== undefined && obj[key] !== null
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