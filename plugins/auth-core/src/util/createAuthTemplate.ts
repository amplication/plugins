import { Module, DsgContext } from "@amplication/code-gen-types";
import { readFile } from "@amplication/code-gen-utils";
import {
  addImports,
  importNames,
  interpolate,
  removeTSClassDeclares,
  removeTSInterfaceDeclares,
} from "../util/ast";
import { builders, namedTypes } from "ast-types";
import { print } from "@amplication/code-gen-utils";
import { AUTH_ENTITY_ERROR, AUTH_ENTITY_LOG_ERROR } from "../constants";

export async function mapAuthTemplate(
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
    const entityInfoName = `${authEntity?.name}Info`;
    const template = await readFile(templatePath);
    const authEntityNameId = builders.identifier(entityInfoName);

    const entityNamImport = importNames(
      [authEntityNameId],
      `./${entityInfoName}`
    );

    addImports(
      template,
      [entityNamImport].filter(
        (x) => x //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[]
    );

    const templateMapping = {
      ENTITY_NAME_INFO: builders.identifier(`${authEntity.name}Info`),
      ENTITY_NAME: builders.identifier(
        `${authEntity.name.toLocaleLowerCase()}Info`
      ),
    };

    const filePath = `${serverDirectories.authDirectory}/${fileName}`;

    interpolate(template, templateMapping);
    removeTSClassDeclares(template);
    removeTSInterfaceDeclares(template);

    return {
      code: print(template).code,
      path: filePath,
    };
  } catch (error) {
    console.log(error);
    return { code: "", path: "" };
  }
}
