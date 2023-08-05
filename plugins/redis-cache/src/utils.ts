import { PluginInstallation, VariableDictionary } from "@amplication/code-gen-types";
import { name as PackageName } from "../package.json";
import { Settings } from "./types";
import { settings as defaultSettings } from "../.amplicationrc.json";
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
    ...defaultSettings,
    ...userSettings,
  };

  return settings;
};

export const settingToEnvVar = (settingKey: keyof Settings): string => {
  const mapping = {
    host: "REDIS_HOST",
    port: "REDIS_PORT",
    ttl: "REDIS_TTL",
    max: "REDIS_MAX_REQUESTS_CACHED",
    username: "REDIS_USERNAME",
    password: "REDIS_PASSWORD"
  }
  return mapping[settingKey]
}

export const settingsToVarDict = (settings: Settings): VariableDictionary => {
  return Object.keys(settings)
      .map((settingKey) => ({
          [settingToEnvVar(settingKey as keyof Settings)]:
            defaultSettings[settingKey as keyof Settings]?.toString()
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
  return stmt.slice(0, -1)
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
