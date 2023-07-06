import { Module, DsgContext } from "@amplication/code-gen-types";
import { join } from "path";
import { OperationCanceledException } from "typescript";
import { templatesPath } from "../constants";
import { readFile } from "@amplication/code-gen-utils";
import {
  addImports,
  getClassDeclarationById,
  importNames,
  interpolate,
  removeTSClassDeclares,
  addInjectableDependency,
} from "../util/ast";
import { builders, namedTypes } from "ast-types";
import { print } from "@amplication/code-gen-utils";

const jwtStrategyPath = join(templatesPath, "jwt.strategy.template.base.ts");

export async function createJwtStrategy(
  dsgContext: DsgContext
): Promise<Module> {
  return await mapJwtStrategyTemplate(
    dsgContext,
    jwtStrategyPath,
    "jwt.strategy.base.ts"
  );
}

async function mapJwtStrategyTemplate(
  context: DsgContext,
  templatePath: string,
  fileName: string
): Promise<Module> {
  const { entities, resourceInfo, serverDirectories } = context;
  const authEntity = entities?.find(
    (x) => x.name === resourceInfo?.settings.authEntityName
  );
  if (!authEntity) throw OperationCanceledException; //todo: handle the exception

  const entityInfoName = `${authEntity?.name}Info`;
  const entityServiceName = `${authEntity?.name}Service`;

  const template = await readFile(templatePath);
  const authEntityNameId = builders.identifier(entityInfoName);
  const authServiceNameId = builders.identifier(entityServiceName);

  const entityNameImport = importNames(
    [authEntityNameId],
    `../../${entityInfoName}`
  );

  const entityNameToLower = authEntity?.name.toLowerCase();

  const entityServiceImport = importNames(
    [authServiceNameId],
    `../../../${entityNameToLower}/${entityNameToLower}.service`
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
  };

  const filePath = `${serverDirectories.authDirectory}/jwt/base/${fileName}`;

  interpolate(template, templateMapping);

  const classDeclaration = getClassDeclarationById(
    template,
    builders.identifier("JwtStrategyBase")
  );

  const entityServiceIdentifier = builders.identifier(
    `${entityNameToLower}Service`
  );

  addInjectableDependency(
    classDeclaration,
    entityServiceIdentifier.name,
    builders.identifier(`${authEntity?.name}Service`),
    "protected"
  );

  removeTSClassDeclares(template);

  return {
    code: print(template).code,
    path: filePath,
  };
}