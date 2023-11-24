import { DsgContext, Module } from "@amplication/code-gen-types";
import { join } from "path";
import {
  AUTH_ENTITY_ERROR,
  AUTH_ENTITY_LOG_ERROR,
  templatesPath,
} from "../constants";
import {
  print,
  readFile,
  removeTSClassDeclares,
} from "@amplication/code-gen-utils";
import { builders } from "ast-types";
import { addImports, importNames, interpolate } from "@utils/ast";

const authModulePath = join(templatesPath, "auth.module.template.ts");

export const createAuthModule = async (
  context: DsgContext,
): Promise<Module> => {
  return await mapAuthModuleTemplate(context, authModulePath, "auth.module.ts");
};

const mapAuthModuleTemplate = async (
  context: DsgContext,
  templatePath: string,
  fileName: string,
): Promise<Module> => {
  const { entities, resourceInfo, serverDirectories } = context;
  const authEntity = entities?.find(
    (x) => x.name === resourceInfo?.settings.authEntityName,
  );

  context.logger.info(`Creating ${fileName} file...`);

  if (!authEntity) {
    context.logger.error(AUTH_ENTITY_LOG_ERROR);
    throw new Error(AUTH_ENTITY_ERROR);
  }

  try {
    const entityModuleName = `${authEntity?.name}Module`;
    const authModuleNameId = builders.identifier(entityModuleName);
    const entityNameToLower = authEntity?.name.toLowerCase();

    const template = await readFile(templatePath);
    const authModuleImport = importNames(
      [authModuleNameId],
      `../${entityNameToLower}/${entityNameToLower}.module`,
    );

    addImports(template, [authModuleImport]);

    const templateMapping = {
      ENTITY_MODULE: builders.identifier(entityModuleName),
    };

    const filePath = `${serverDirectories.authDirectory}/${fileName}`;

    interpolate(template, templateMapping);

    removeTSClassDeclares(template);

    return {
      code: print(template).code,
      path: filePath,
    };
  } catch (error) {
    console.error(error);
    return { code: "", path: "" };
  }
};
