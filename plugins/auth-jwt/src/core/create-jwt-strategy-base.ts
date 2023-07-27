import { Module, DsgContext } from "@amplication/code-gen-types";
import { join } from "path";
import { AUTH_ENTITY_ERROR, templatesPath } from "../constants";
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

const jwtStrategyBasePath = join(
  templatesPath,
  "jwt.strategy.template.base.ts"
);

export async function createJwtStrategyBase(
  dsgContext: DsgContext
): Promise<Module> {
  return await mapJwtStrategyTemplate(
    dsgContext,
    jwtStrategyBasePath,
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
  if (!authEntity) {
    context.logger.error(AUTH_ENTITY_ERROR);
    throw new Error(AUTH_ENTITY_ERROR);
  }

  try {
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
  } catch (error) {
    console.error(error);
    return { code: "", path: "" };
  }
}
