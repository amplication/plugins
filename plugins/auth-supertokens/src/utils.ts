import { PluginInstallation, VariableDictionary } from "@amplication/code-gen-types";
import { namedTypes, ASTNode } from "ast-types";
import * as recast from "recast";
import { parse } from "@amplication/code-gen-utils";
import { name as PackageName } from "../package.json";
import { Settings } from "./types";
import { settings as defaultSettings } from "../.amplicationrc.json";

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
    return recast.prettyPrint(parse(code)).code
}

export const settingToEnvVar = (settingKey: keyof Settings): string => {
  const prefix = "SUPERTOKENS";
  const mapping: {[key in keyof Settings]: string} = {
    apiBasePath: `${prefix}_API_BASE_PATH`,
    apiDomain: `${prefix}_API_DOMAIN`,
    appName: `${prefix}_APP_NAME`,
    apiGatewayPath: `${prefix}_API_GATEWAY_PATH`,
    connectionUri: `${prefix}_CONNECTION_URI`,
    websiteBasePath: `${prefix}_WEBSITE_BASE_PATH`,
    websiteDomain: `${prefix}_WEBSITE_DOMAIN`
  }
  return mapping[settingKey]
}

export const settingsToVarDict = (settings: Settings): VariableDictionary => {
  return Object.keys(settings)
      .map((settingKey) => ({
          [settingToEnvVar(settingKey as keyof Settings)]:
            settings[settingKey as keyof Settings].toString()
      }))
}
