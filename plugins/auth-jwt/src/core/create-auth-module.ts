import { Module, DsgContext } from "@amplication/code-gen-types";
import { join } from "path";
import { AUTH_ENTITY_ERROR, templatesPath } from "../constants";
import { readFile } from "@amplication/code-gen-utils";
import {
  addImports,
  importNames,
  interpolate,
  removeTSClassDeclares,
} from "../util/ast";
import { builders, namedTypes } from "ast-types";
import { print } from "@amplication/code-gen-utils";

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
    context.logger.error(AUTH_ENTITY_ERROR);
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
