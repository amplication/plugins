import { DsgContext, Module } from "@amplication/code-gen-types";
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
} from "@amplication/code-gen-utils";
import { builders } from "ast-types";
import {
  addImports,
  addInjectableDependency,
  getClassDeclarationById,
  importNames,
  interpolate,
} from "@utils/ast";

const jwtStrategyPath = join(templatesPath, "jwt.strategy.template.ts");

export const createJwtStrategy = async (context: DsgContext) => {
  return mapJwtStrategyTemplate(context, jwtStrategyPath, "jwt.strategy.ts");
};

const mapJwtStrategyTemplate = async (
  context: DsgContext,
  templatePath: string,
  fileName: string
): Promise<Module> => {
  const { entities, resourceInfo, serverDirectories } = context;
  const authEntity = entities?.find(
    (x) => x.name === resourceInfo?.settings.authEntityName
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
      `${entityNameToLower}Service`
    );

    const template = await readFile(templatePath);

    const entityNameId = builders.identifier(entityInfoName);
    const entityServiceNameId = builders.identifier(entityServiceName);

    // Making the imports for authetication entity
    const entityNameImport = importNames(
      [entityNameId],
      `../${entityInfoName}`
    );

    const entityServiceImport = importNames(
      [entityServiceNameId],
      `src/${entityNameToLower}/${entityNameToLower}.service`
    );

    addImports(template, [entityNameImport, entityServiceImport]);

    const templateMapping = {
      ENTITY_NAME_INFO: entityNameId,
      ENTITY_SERVICE: entityServiceIdentifier,
      ENTITY_FIELDS: builders.identifier(`${entityNameToLower}Fields`),
      VALIDATED_ENTITY: builders.identifier(`validated${authEntity?.name}`),
      NEW_ENTITY: builders.identifier(`new${authEntity?.name}`),
    };

    const filePath = `${serverDirectories.authDirectory}/jwt/${fileName}`;

    interpolate(template, templateMapping);

    const classDeclaration = getClassDeclarationById(
      template,
      builders.identifier("JwtStrategy")
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
};
