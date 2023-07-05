import { Module, DsgContext } from "@amplication/code-gen-types";
import { join } from "path";
import { templatesPath } from "../constants";
import { OperationCanceledException } from "typescript";
import { readFile, print } from "@amplication/code-gen-utils";
import {
  addImports,
  importNames,
  interpolate,
  removeTSClassDeclares,
} from "../util/ast";
import { builders, namedTypes } from "ast-types";

const authServiceSpecPath = join(
  templatesPath,
  "auth.service.spec.template.ts"
);

export async function createAuthServiceSpec(
  dsgContext: DsgContext
): Promise<Module> {
  const { entities, resourceInfo, serverDirectories } = dsgContext;
  const authEntity = entities?.find(
    (x) => x.name === resourceInfo?.settings.authEntityName
  );
  if (!authEntity) throw OperationCanceledException; //todo: handle the exception

  const entityServiceName = `${authEntity?.name}Service`;

  const template = await readFile(authServiceSpecPath);
  const authServiceNameId = builders.identifier(entityServiceName);

  const entityNameToLower = authEntity?.name.toLowerCase();

  const entityServiceImport = importNames(
    [authServiceNameId],
    `../${entityNameToLower}/${entityNameToLower}.service`
  );

  addImports(
    template,
    [entityServiceImport].filter(
      (x) => x //remove nulls and undefined
    ) as namedTypes.ImportDeclaration[]
  );

  const templateMapping = {
    ENTITY_SERVICE: builders.identifier(entityServiceName),
  };

  interpolate(template, templateMapping);

  const filePath = `${serverDirectories.authDirectory}/auth.service.spec.ts`;

  removeTSClassDeclares(template);

  return {
    code: print(template).code,
    path: filePath,
  };
}
