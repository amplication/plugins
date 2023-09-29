import { CreateEntityModuleParams, ModuleMap } from "@amplication/code-gen-types";
import { appendImports, print, readFile } from "@amplication/code-gen-utils";
import { join, relative } from "path";
import { templatesPath } from "../constants";
import { builders, namedTypes } from "ast-types";
import { interpolate } from "../utils";
import { camelCase } from "lodash";

export const addAuthModuleInAuthDir = async (
    params: CreateEntityModuleParams,
    modules: ModuleMap,
    srcDirectory: string,
    authDirectory: string
) => {
    const templatePath = join(templatesPath, "auth.module.template.ts");
    const template = await readFile(templatePath);
    const moduleId = getModuleId(params);
    const templateMapping = {
        AUTH_ENTITY_MODULE_ID: moduleId
    };
    appendImports(template, [
        builders.importDeclaration([
            builders.importSpecifier(moduleId)
        ], getModulePath(params, srcDirectory, authDirectory))
    ]);
    interpolate(template, templateMapping);
    modules.set({
        path: join(authDirectory, "auth.module.ts"),
        code: print(template).code
    })
}

const getModuleId = (params: CreateEntityModuleParams): namedTypes.Identifier => {
    if(!params.templateMapping.MODULE) {
        throw new Error("Failed to find the module ID of the auth entity");
    }
    return params.templateMapping.MODULE as namedTypes.Identifier
}

const getModulePath = (
    params: CreateEntityModuleParams,
    srcDirectory: string,
    authDirectory: string
): namedTypes.StringLiteral => {
    const modulePath = `${srcDirectory}/${camelCase(params.entityName)}/${camelCase(params.entityName)}.module`;
    const path = relative(authDirectory, modulePath);
    if(!path) {
        throw new Error("The source directory is not a parent of the auth directory");
    }
    return builders.stringLiteral(path);
}
