import { Module, DsgContext } from "@amplication/code-gen-types";
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
import { builders, namedTypes } from "ast-types";
import {
  addImports,
  importNames,
  interpolate,
} from "@utils/ast";

const authModulePath = join(templatesPath, "auth.module.template.ts");

export async function createAuthModule(
  dsgContext: DsgContext
): Promise<Module> {
  return await mapAuthModuleTemplate(
    dsgContext,
    authModulePath,
    "auth.module.ts"
  );
}

async function mapAuthModuleTemplate(
  context: DsgContext,
  templatePath: string,
  fileName: string
): Promise<Module> {
  const { entities, resourceInfo, serverDirectories } = context;
  const authEntity = entities?.find(
    (x) => x.name === resourceInfo?.settings.authEntityName
  );
  if (!authEntity) {
    context.logger.error(AUTH_ENTITY_LOG_ERROR);
    throw new Error(AUTH_ENTITY_ERROR);
  }
  try {
    const entityModuleName = `${authEntity?.name}Module`;

    const template = await readFile(templatePath);
    const authModuleNameId = builders.identifier(entityModuleName);

    const entityNameToLower = authEntity?.name.toLowerCase();

    const authModuleImport = importNames(
      [authModuleNameId],
      `../${entityNameToLower}/${entityNameToLower}.module`
    );

    addImports(
      template,
      [authModuleImport].filter(
        (x) => x //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[]
    );

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
}
