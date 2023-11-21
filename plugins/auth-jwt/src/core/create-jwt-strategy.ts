import { Module, DsgContext } from "@amplication/code-gen-types";
import { join } from "path";
import {
  AUTH_ENTITY_ERROR,
  AUTH_ENTITY_LOG_ERROR,
  templatesPath,
} from "../constants";
import { readFile } from "@amplication/code-gen-utils";
import {
  addImports,
  getClassDeclarationById,
  importNames,
  interpolate,
  removeTSClassDeclares,
  addInjectableDependency,
  memberExpression
} from "../util/ast";
import { createAuthEntityObjectCustomProperties } from "../util/createAuthProperties";
import { builders, namedTypes } from "ast-types";
import { print } from "@amplication/code-gen-utils";

const jwtStrategyPath = join(templatesPath, "jwt.strategy.template.ts");

const KeycloakFields = new Set([
  "name",
  "email",
  "username",
  "given_name",
  "preferred_username",
  "firstName",
  "lastName"
]);

const createDefaultKeycloakUserFields = (
  entity: Entity,
  recipe: IRecipe,
  defaultUser: Record<string, unknown> | undefined,
  entityFields: namedTypes.Identifier,
  authEmailField: EntityField,
) => {
  const { payloadFieldMapping } = recipe;

  if (authEmailField?.unique === false)
    throw new Error(
      `The field ${authEmailField.name} in the entity ${entity.name} must be unique`,
    );
  else if (authEmailField?.searchable === false)
    throw new Error(
      `The field ${authEmailField.name} in the entity ${entity.name} must be searchable`,
    );

  const emailProperty = builders.objectProperty(
    builders.identifier(authEmailField?.name || "email"),
    memberExpression`${entityFields}.${builders.identifier("email")}`,
  );

  const payloadProperties = Object.entries(payloadFieldMapping || {})
    .filter(([, value]) => value !== "email")
    .map(([key, value]) => {
      if (!KeycloakFields.has(value)) {
        throw new Error(
          `The field ${value} is not a valid Keycloak payload field`,
        );
      }

      if (!entity.fields.find((field) => field.name === key)) {
        throw new Error(
          `The entity ${entity.name} does not have a field named ${key} which is mapped to ${value} in the payloadFieldMapping property`,
        );
      }

      return builders.objectProperty(
        builders.identifier(key),
        memberExpression`${entityFields}.${builders.identifier(value)}`,
      );
    });

  const remainingFields = entity.fields.filter(
    (field) =>
      !Object.keys(payloadFieldMapping || {}).includes(field.name) &&
      field.name !== "email",
  );
  const defaultProperties = createAuthEntityObjectCustomProperties(
    { ...entity, fields: remainingFields },
    defaultUser || {},
  );

  return [emailProperty, ...payloadProperties, ...defaultProperties];
};

export async function createJwtStrategy(
  dsgContext: DsgContext
): Promise<Module> {
  return await mapJwtStrategyTemplate(
    dsgContext,
    jwtStrategyPath,
    "jwt.strategy.ts"
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
  if (!authEntity) {
    context.logger.error(AUTH_ENTITY_LOG_ERROR);
    throw new Error(AUTH_ENTITY_ERROR);
  }

  try {
    const entityServiceName = `${authEntity?.name}Service`;

    const template = await readFile(templatePath);
    const authServiceNameId = builders.identifier(entityServiceName);

    const entityNameToLower = authEntity?.name.toLowerCase();

    const entityServiceImport = importNames(
      [authServiceNameId],
      `../../${entityNameToLower}/${entityNameToLower}.service`
    );

    addImports(
      template,
      [entityServiceImport].filter(
        (x) => x //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[]
    );

    const templateMapping = {
      ENTITY_SERVICE: builders.identifier(`${entityNameToLower}Service`),
    };

    const filePath = `${serverDirectories.authDirectory}/jwt/${fileName}`;

    interpolate(template, templateMapping);

    const classDeclaration = getClassDeclarationById(
      template,
      builders.identifier("JwtStrategy")
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
  } catch (error) {
    console.error(error);
    return { code: "", path: "" };
  }
}
