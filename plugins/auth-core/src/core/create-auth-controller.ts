import { types, Module, DsgContext, Entity } from "@amplication/code-gen-types";
import { readFile } from "@amplication/code-gen-utils";
import {
  addImports,
  importNames,
  interpolate,
  removeTSClassDeclares,
} from "../util/ast";
import { builders, namedTypes } from "ast-types";
import { print } from "@amplication/code-gen-utils";
import { join } from "path";
import { templatesPath } from "../constants";
import { OperationCanceledException } from "typescript";

const authControllerPath = join(templatesPath, "auth.controller.template.ts");

export async function createAuthController(
  dsgContext: DsgContext
): Promise<Module> {
  const { entities, resourceInfo, serverDirectories } = dsgContext;
  const authEntity = entities?.find(
    (x) => x.name === resourceInfo?.settings.authEntityName
  );
  if (!authEntity) throw OperationCanceledException; //todo: handle the exception

  const entityInfoName = `${authEntity?.name}Info`;
  const authControllerTemplate = await readFile(authControllerPath);
  const authEntityNameId = builders.identifier(entityInfoName);

  const entityNamImport = importNames(
    [authEntityNameId],
    `./${entityInfoName}`
  );

  addImports(
    authControllerTemplate,
    [entityNamImport].filter(
      (x) => x //remove nulls and undefined
    ) as namedTypes.ImportDeclaration[]
  );

  const authControllerTemplateMapping = {
    ENTITY_NAME_INFO: builders.identifier(`${authEntity.name}Info`),
  };

  const filePath = `${serverDirectories.authDirectory}/auth.controller.ts`;

  interpolate(authControllerTemplate, authControllerTemplateMapping);
  removeTSClassDeclares(authControllerTemplate);

  return {
    code: print(authControllerTemplate).code,
    path: filePath,
  };
}
