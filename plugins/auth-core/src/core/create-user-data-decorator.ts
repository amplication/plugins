import { Module, DsgContext } from "@amplication/code-gen-types";
import { join } from "path";
import { templatesPath } from "../constants";
import { print, readFile } from "@amplication/code-gen-utils";
import {
  addImports,
  importNames,
  interpolate,
  removeTSClassDeclares,
} from "../util/ast";
import { builders, namedTypes } from "ast-types";

const userDataDecoratorPath = join(
  templatesPath,
  "userData.decorator.template.ts",
);

export async function createUserDataDecorator(
  dsgContext: DsgContext,
): Promise<Module> {
  return await mapUserDataDecoratorTemplate(
    dsgContext,
    userDataDecoratorPath,
    "userData.decorator.ts",
  );
}

async function mapUserDataDecoratorTemplate(
  context: DsgContext,
  templatePath: string,
  fileName: string,
): Promise<Module> {
  const { entities, resourceInfo, serverDirectories } = context;
  const authEntity = entities?.find(
    (x) => x.name === resourceInfo?.settings.authEntityName,
  );
  if (!authEntity) {
    context.logger.error("Authentication entity does not exist");
    return { code: "", path: "" };
  }

  const template = await readFile(templatePath);
  const authEntityNameId = builders.identifier(authEntity?.name);

  const entityNameImport = importNames([authEntityNameId], "@prisma/client");

  addImports(
    template,
    [entityNameImport].filter(
      (x) => x, //remove nulls and undefined
    ) as namedTypes.ImportDeclaration[],
  );

  const templateMapping = {
    AUTH_ENTITY_NAME: builders.identifier(authEntity?.name),
  };

  const filePath = `${serverDirectories.authDirectory}/${fileName}`;

  interpolate(template, templateMapping);

  removeTSClassDeclares(template);

  return {
    code: print(template).code,
    path: filePath,
  };
}
