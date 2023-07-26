import { Module, DsgContext } from "@amplication/code-gen-types";
import { join } from "path";
import { templatesPath } from "../constants";
import { readFile } from "@amplication/code-gen-utils";
import {
  addImports,
  getClassDeclarationById,
  importNames,
  interpolate,
  removeTSClassDeclares,
} from "../util/ast";
import { builders, namedTypes } from "ast-types";
import { print } from "@amplication/code-gen-utils";
import { addInjectableDependency } from "../util/nestjs-code-generation";

const authServicePath = join(templatesPath, "auth.service.template.ts");

export async function createAuthService(
  dsgContext: DsgContext
): Promise<Module> {
  return await mapAuthServiceTemplate(
    dsgContext,
    authServicePath,
    "auth.service.ts"
  );
}

async function mapAuthServiceTemplate(
  context: DsgContext,
  templatePath: string,
  fileName: string
): Promise<Module> {
  const { entities, resourceInfo, serverDirectories } = context;
  const authEntity = entities?.find(
    (x) => x.name === resourceInfo?.settings.authEntityName
  );
  if (!authEntity) {
    context.logger.error("Authentication entity does not exist");
    return { code: "", path: "" };
  }

  const entityInfoName = `${authEntity?.name}Info`;
  const entityServiceName = `${authEntity?.name}Service`;

  const template = await readFile(templatePath);
  const authEntityNameId = builders.identifier(entityInfoName);
  const authServiceNameId = builders.identifier(entityServiceName);

  const entityNameImport = importNames(
    [authEntityNameId],
    `./${entityInfoName}`
  );

  const entityNameToLower = authEntity?.name.toLowerCase();

  const entityServiceImport = importNames(
    [authServiceNameId],
    `../${entityNameToLower}/${entityNameToLower}.service`
  );

  addImports(
    template,
    [entityNameImport, entityServiceImport].filter(
      (x) => x //remove nulls and undefined
    ) as namedTypes.ImportDeclaration[]
  );

  const templateMapping = {
    ENTITY_NAME_INFO: builders.identifier(`${authEntity.name}Info`),
    ENTITY_SERVICE: builders.identifier(`${entityNameToLower}Service`),
    ENTITY_SERVICE_UPPER: builders.identifier(`${authEntity?.name}Service`),
  };

  const filePath = `${serverDirectories.authDirectory}/${fileName}`;

  interpolate(template, templateMapping);

  const classDeclaration = getClassDeclarationById(
    template,
    builders.identifier("AuthService")
  );

  const entityServiceIdentifier = builders.identifier(
    `${entityNameToLower}Service`
  );

  addInjectableDependency(
    classDeclaration,
    entityServiceIdentifier.name,
    builders.identifier(`${authEntity?.name}Service`),
    "private"
  );

  removeTSClassDeclares(template);

  return {
    code: print(template).code,
    path: filePath,
  };
}
