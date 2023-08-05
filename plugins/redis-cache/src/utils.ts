import { PluginInstallation } from "@amplication/code-gen-types";
import { name as PackageName } from "../package.json";
import { Settings } from "./types";
import defaultSettings from "../.amplicationrc.json";
import { File } from "@babel/types";
import { namedTypes, } from "ast-types";
import * as recast from "recast";
import * as recastBabelParser from "recast/parsers/babel";
import getBabelOptions, { Overrides } from "recast/parsers/_babel_options";

export const getPluginSettings = (
  pluginInstallations: PluginInstallation[]
): Settings => {
  const plugin = pluginInstallations.find(
    (plugin) => plugin.npm === PackageName
  );

  const userSettings = plugin?.settings ?? {};

  const settings: Settings = {
    ...defaultSettings.settings,
    ...userSettings,
  };

  return settings;
};

export const settingToEnvVar = (settingKey: keyof Settings): string => {
  const mapping = {
    host: "REDIS_HOST",
    port: "REDIS_PORT",
    ttl: "REDIS_TTL",
    max: "REDIS_MAX_REQUESTS_CACHED"
  }
  return mapping[settingKey]
}

export function addImport(
  file: namedTypes.File,
  newImport: namedTypes.ImportDeclaration
): void {
  const imports = extractImportDeclarations(file);
  imports.push(newImport);
  file.program.body.unshift(...imports);
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

export function getOptions(options?: Overrides): Options {
  const babelOptions = getBabelOptions(options);
  babelOptions.plugins.push("typescript", "jsx");
  return babelOptions;
}

export type Options = ReturnType<typeof getBabelOptions>;

type ParseOptions = Omit<recast.Options, "parser">;

/**
 * Wraps recast.parse()
 * Sets parser to use the TypeScript parser
 */
export function parse(source: string, options?: ParseOptions): namedTypes.File {
  try {
    return recast.parse(source, {
      ...{
        parser: {
          getOptions,
          parse: (source: string, options?: Overrides): File => {
            return recastBabelParser.parser.parse(source, getOptions(options));
          },
        },
      },
      ...options,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`${error.message}Source:${source}`);
    }
    throw error;
  }
}
