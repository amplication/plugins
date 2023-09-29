import { DsgContext, ModuleMap } from "@amplication/code-gen-types";
import { resolve, join, relative } from "path";
import { readFile, print, appendImports } from "@amplication/code-gen-utils";
import * as constants from "../constants";
import { Settings } from "../types";
import { namedTypes, builders } from "ast-types";
import { interpolate } from "../utils";
import { camelCase } from "lodash";

export const addSupertokensFiles = async (context: DsgContext, modules: ModuleMap, settings: Settings) => {
    const { authDirectory } = context.serverDirectories;

    const unneededInAuth = [
      "token.service.ts",
      "password.service.ts",
      "password.service.spec.ts",
      "LoginArgs.ts",
      "ITokenService.ts",
      "IAuthStrategy.ts",
      "Credentials.ts",
      "constants.ts",
      "auth.service.ts",
      "auth.service.spec.ts",
      "auth.controller.ts",
      "auth.resolver.ts"
    ];

    const newModules = new ModuleMap(context.logger);

    for(const module of modules.modules()) {
      if(unneededInAuth.find((val) => val === `${authDirectory}/${module.path}`)) {
        continue;
      }
      newModules.set(module);
    }

    const fileNames = [
      "auth.filter.ts",
      "auth.guard.ts",
      "auth.middleware.ts",
      "config.interface.ts",
      "generateSupertokensOptions.ts",
      "session.decorator.ts",
      "auth.error.ts"
    ];

    for(const name of fileNames) {
      const filePath = resolve(constants.staticsPath, "supertokens", name);
      const file = await readFile(filePath);
      await modules.set({
        code: print(file).code,
        path: join(authDirectory, "supertokens", name)
      });
    }

    return newModules;
}

export const createSupertokensService = async (
    settings: Settings,
    authDirectory: string,
    srcDirectory: string,
    authEntityName: string,
    modules: ModuleMap
) => {
    const templatePath = resolve(constants.templatesPath, "supertokens.service.template.ts");
    const template = await readFile(templatePath);
    const templateMapping = {
        EMAIL_FIELD_NAME: builders.identifier(settings.emailFieldName),
        PASSWORD_FIELD_NAME: builders.identifier(settings.passwordFieldName),
        SUPERTOKENS_ID_FIELD_NAME: builders.identifier(constants.SUPERTOKENS_ID_FIELD_NAME),
        AUTH_ENTITY_SERVICE_ID: getAuthEntityServiceId(authEntityName),
        AUTH_ENTITY_ID: builders.identifier(authEntityName)
    }
    appendImports(template, [
        authEntityServiceImport(srcDirectory, authDirectory, authEntityName),
        authEntityImport(srcDirectory, authDirectory, authEntityName)
    ])
    interpolate(template, templateMapping);
    modules.set({
        path: join(authDirectory, "supertokens", "supertokens.service.ts"),
        code: print(template).code
    })
}

const getAuthEntityServiceId = (authEntityName: string): namedTypes.Identifier => {
    return builders.identifier(`${authEntityName}Service`)
}

const getAuthEntityIdPath = (
    authEntityName: string,
    srcDirectory: string,
    authDirectory: string
): namedTypes.StringLiteral => {
    const entityPath = `${srcDirectory}/${camelCase(authEntityName)}/base/${authEntityName}`;
    const supertokensDir = `${authDirectory}/supertokens`;
    return builders.stringLiteral(relative(supertokensDir, entityPath));
}

const getAuthEntityServicePath = (
    srcDirectory: string,
    authDirectory: string,
    authEntityName: string
): namedTypes.StringLiteral => {
    const servicePath = `${srcDirectory}/${camelCase(authEntityName)}/${camelCase(authEntityName)}.service`;
    const supertokensDir = `${authDirectory}/supertokens`;
    return builders.stringLiteral(relative(supertokensDir, servicePath));
}

const authEntityServiceImport = (
    srcDirectory: string,
    authDirectory: string,
    authEntityName: string
): namedTypes.ImportDeclaration => {
    return builders.importDeclaration([
        builders.importSpecifier(getAuthEntityServiceId(authEntityName))
    ], getAuthEntityServicePath(srcDirectory, authDirectory, authEntityName));
}

const authEntityImport = (
    srcDirectory: string,
    authDirectory: string,
    authEntityName: string
): namedTypes.ImportDeclaration => {
    return builders.importDeclaration([
        builders.importSpecifier(builders.identifier(authEntityName))
    ], getAuthEntityIdPath(authEntityName, srcDirectory, authDirectory))
}
