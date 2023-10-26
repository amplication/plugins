import { DsgContext, Entity, Module } from "@amplication/code-gen-types";
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
import { builders, namedTypes } from "ast-types";
import {
  addImports,
  addInjectableDependency,
  getClassDeclarationById,
  importNames,
  interpolate,
  memberExpression,
} from "@utils/ast";
import { getPluginSettings } from "@utils/getPluginSettings";
import { IRecipe } from "../types";
import { createAuthEntityObjectCustomProperties } from "@utils/createAuthProperties";

const jwtStrategyPath = join(templatesPath, "jwt.strategy.template.ts");

const Auth0Fields = new Set([
  "email",
  "email_verified",
  "name",
  "nickname",
  "picture",
  "username",
]);

const createDefaultAuth0UserFields = (entity: Entity, recipe: IRecipe, defaultUser: Record<string, unknown>, entityFields: namedTypes.Identifier) => { 
  const { emailField, payloadFieldMapping } = recipe;

  if(!emailField && Object.values(payloadFieldMapping || {}).includes("email") && !entity.fields.find((field) => field.name === "email")) {
    throw new Error(`The entity ${entity.name} does not have an email field, and the email field is not mapped to any other field in the payloadFieldMapping`);
  }
  
  const emailProperty = builders.objectProperty(
    builders.identifier(emailField || Object.keys(payloadFieldMapping || {}).find((key) => payloadFieldMapping[key] === "email") || "email"),
    memberExpression`${entityFields}.${builders.identifier("email")}`,
  );

  const payloadProperties = Object.entries(payloadFieldMapping || {}).filter(([, value]) => value !== "email").map(([key, value]) => {
    if(!Auth0Fields.has(value)) {
      throw new Error(`The field ${value} is not a valid Auth0 payload field`);
    }

    if(!entity.fields.find((field) => field.name === key)) {
      throw new Error(`The entity ${entity.name} does not have a field named ${key}`);
    }

    return builders.objectProperty(
      builders.identifier(key),
      memberExpression`${entityFields}.${builders.identifier(value)}`,
    );
  });

  const remainingFields = entity.fields.filter((field) => !Object.keys(payloadFieldMapping || {}).includes(field.name) && field.name !== "email");
  const defaultProperties = createAuthEntityObjectCustomProperties({...entity, fields: remainingFields}, defaultUser);

  return [ emailProperty, ...payloadProperties, ...defaultProperties];
};

export const createJwtStrategy = async (context: DsgContext) => {
  return mapJwtStrategyTemplate(context, jwtStrategyPath, "jwt.strategy.ts");
};

const mapJwtStrategyTemplate = async (
  context: DsgContext,
  templatePath: string,
  fileName: string,
): Promise<Module> => {
  const { entities, resourceInfo, serverDirectories } = context;
  const { recipe, defaultUser } = getPluginSettings(context.pluginInstallations);
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
    const entityFields = builders.identifier(`${entityNameToLower}Fields`);

    // Making the imports for authetication entity
    const entityNameImport = importNames(
      [entityNameId],
      `../${entityInfoName}`,
    );

    const entityServiceImport = importNames(
      [entityServiceNameId],
      `src/${entityNameToLower}/${entityNameToLower}.service`,
    );

    addImports(template, [entityNameImport, entityServiceImport]);

    const templateMapping = {
      ENTITY_NAME_INFO: entityNameId,
      ENTITY_SERVICE: entityServiceIdentifier,
      ENTITY_FIELDS: entityFields,
      VALIDATED_ENTITY: builders.identifier(`validated${authEntity?.name}`),
      NEW_ENTITY: builders.identifier(`new${authEntity?.name}`),
      DATA: builders.objectExpression(createDefaultAuth0UserFields(authEntity, recipe, defaultUser, entityFields)),
    };

    const filePath = `${serverDirectories.authDirectory}/jwt/${fileName}`;

    interpolate(template, templateMapping);

    const classDeclaration = getClassDeclarationById(
      template,
      builders.identifier("JwtStrategy"),
    );

    addInjectableDependency(
      classDeclaration,
      entityServiceIdentifier.name,
      builders.identifier(`${authEntity?.name}Service`),
      "protected",
    );

    removeTSClassDeclares(template);
    removeTSIgnoreComments(template);

    return {
      code: print(template).code,
      path: filePath,
    };
  } catch (error) {
    context.logger.error(`Failed to create ${fileName} file`);
    context.logger.error((error as Error).message, undefined, undefined, error as Error);
    throw error;
  }
};
