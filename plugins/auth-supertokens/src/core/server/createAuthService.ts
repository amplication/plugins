import { BuildLogger, ModuleMap } from "@amplication/code-gen-types";
import { appendImports, print, readFile } from "@amplication/code-gen-utils";
import { join, resolve, relative } from "path";
import { builders, namedTypes } from "ast-types";
import { templatesPath } from "../../constants";
import { camelCase } from "lodash";
import { interpolate } from "../../utils";

export const createAuthService = async (
  modules: ModuleMap,
  srcDirectory: string,
  authDirectory: string,
  authEntityName: string,
  logger: BuildLogger
) => {
  logger.info("Creating a new auth service file for the server");
  const templatePath = resolve(templatesPath, "auth.service.template.ts");
  const template = await readFile(templatePath);
  logger.info("Adding the auth entity service import to the auth service");
  appendImports(template, [
    authEntityServiceImport(srcDirectory, authDirectory, authEntityName),
  ]);
  const templateMapping = {
    AUTH_ENTITY_SERVICE_ID: getAuthEntityServiceId(authEntityName),
  };
  interpolate(template, templateMapping);
  modules.set({
    path: join(authDirectory, "auth.service.ts"),
    code: print(template).code,
  });
};

const getAuthEntityServiceId = (
  authEntityName: string
): namedTypes.Identifier => {
  return builders.identifier(`${authEntityName}Service`);
};

const authEntityServiceImport = (
  srcDirectory: string,
  authDirectory: string,
  authEntityName: string
): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importSpecifier(getAuthEntityServiceId(authEntityName))],
    getAuthEntityServicePath(srcDirectory, authDirectory, authEntityName)
  );
};

const getAuthEntityServicePath = (
  srcDirectory: string,
  authDirectory: string,
  authEntityName: string
): namedTypes.StringLiteral => {
  const servicePath = `${srcDirectory}/${camelCase(authEntityName)}/${camelCase(
    authEntityName
  )}.service`;
  return builders.stringLiteral(relative(authDirectory, servicePath));
};
