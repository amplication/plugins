import { DsgContext, EntityField, Module } from "@amplication/code-gen-types";
import {
  AUTH_ENTITY_ERROR,
  AUTH_ENTITY_LOG_ERROR,
  templatesPath,
} from "../constants";
import { join } from "path";
import {
  print,
  readFile,
  removeTSClassDeclares,
  removeTSIgnoreComments,
} from "@amplication/code-gen-utils";
import { builders } from "ast-types";
import {
  addAutoGenerationComment,
  addImports,
  addInjectableDependency,
  getClassDeclarationById,
  importNames,
  interpolate,
} from "@utils/ast";

const jwtStrategyBasePath = join(
  templatesPath,
  "jwt.strategy.base.template.ts",
);

export const createJwtStrategyBase = async (
  context: DsgContext,
  searchableAuthField: EntityField,
): Promise<Module> => {
  return mapJwtStrategyTemplate(
    context,
    searchableAuthField,
    jwtStrategyBasePath,
    "jwt.strategy.base.ts",
  );
};

const mapJwtStrategyTemplate = async (
  context: DsgContext,
  searchableAuthField: EntityField,
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
    const entityInfoName = `${authEntity?.name}Info`;
    const entityServiceName = `${authEntity?.name}Service`;
    const entityNameToLower = `${authEntity?.name.toLowerCase()}`;
    const entityServiceIdentifier = builders.identifier(
      `${entityNameToLower}Service`,
    );

    const template = await readFile(templatePath);
    const entityNameId = builders.identifier(entityInfoName);
    const entityServiceNameId = builders.identifier(entityServiceName);

    // Making the imports for authetication entity
    const entityNameImport = importNames(
      [entityNameId],
      `../../${entityInfoName}`,
    );

    const entityServiceImport = importNames(
      [entityServiceNameId],
      `src/${entityNameToLower}/${entityNameToLower}.service`,
    );

    addImports(template, [entityNameImport, entityServiceImport]);

    const templateMapping = {
      ENTITY_NAME_INFO: entityNameId,
      ENTITY_SERVICE: entityServiceIdentifier,
      ENTITY: builders.identifier(entityNameToLower),
      SEARCHABLE_AUTH_FIELD: builders.identifier(searchableAuthField.name),
    };

    const filePath = `${serverDirectories.authDirectory}/jwt/base/${fileName}`;

    interpolate(template, templateMapping);

    const classDeclaration = getClassDeclarationById(
      template,
      builders.identifier("JwtStrategyBase"),
    );

    addInjectableDependency(
      classDeclaration,
      entityServiceIdentifier.name,
      builders.identifier(`${authEntity?.name}Service`),
      "protected",
    );

    removeTSClassDeclares(template);
    removeTSIgnoreComments(template);
    addAutoGenerationComment(template);

    return {
      code: print(template).code,
      path: filePath,
    };
  } catch (error) {
    console.error(error);
    return { code: "", path: "" };
  }
};
