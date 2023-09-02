import { PluginInstallation } from "@amplication/code-gen-types";
import { namedTypes, ASTNode } from "ast-types";
import * as recast from "recast";
import { parse } from "@amplication/code-gen-utils";
import { name as PackageName } from "../package.json";
import { Settings } from "./types";
import defaultSettings from "../.amplicationrc.json";

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
