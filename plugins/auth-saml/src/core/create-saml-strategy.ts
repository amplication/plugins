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
} from "../util/ast";
import { builders, namedTypes } from "ast-types";
import { print } from "@amplication/code-gen-utils";

const samlStrategyPath = join(templatesPath, "saml.strategy.template.ts");

export async function createSamlStrategy(
  dsgContext: DsgContext,
): Promise<Module> {
  return await mapSamlStrategyTemplate(
    dsgContext,
    samlStrategyPath,
    "saml.strategy.ts",
  );
}

async function mapSamlStrategyTemplate(
  context: DsgContext,
  templatePath: string,
  fileName: string,
): Promise<Module> {
  const { entities, resourceInfo, serverDirectories } = context;
  const authEntity = entities?.find(
    (x) => x.name === resourceInfo?.settings.authEntityName,
  );
  if (!authEntity) {
    context.logger.error(AUTH_ENTITY_LOG_ERROR);
    throw new Error(AUTH_ENTITY_ERROR);
  }

  try {
    const entityServiceName = `${authEntity?.name}Service`;
    const entityCreateInputName = `${authEntity?.name}CreateInput`;

    const template = await readFile(templatePath);
    const authServiceNameId = builders.identifier(entityServiceName);
    const entityCreateInputNameId = builders.identifier(entityCreateInputName);
    const entityPrismaCreateArgsId = builders.identifier(
      `Prisma.${authEntity?.name}CreateArgs["data"]`,
    );

    const entityNameToLower = authEntity?.name.toLowerCase();

    const entityServiceImport = importNames(
      [authServiceNameId],
      `../../${entityNameToLower}/${entityNameToLower}.service`,
    );

    const entityCreateInputDtoImport = importNames(
      [entityCreateInputNameId],
      `../../${entityNameToLower}/base/${entityCreateInputName}`,
    );

    addImports(
      template,
      [entityServiceImport, entityCreateInputDtoImport].filter(
        (x) => x, //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[],
    );

    const templateMapping = {
      ENTITY_SERVICE: builders.identifier(`${entityNameToLower}Service`),
      ENTITY_NAME_PRISMA_CREATE_INPUT: entityPrismaCreateArgsId,
    };

    const filePath = `${serverDirectories.authDirectory}/saml/${fileName}`;

    interpolate(template, templateMapping);

    const classDeclaration = getClassDeclarationById(
      template,
      builders.identifier("SamlStrategy"),
    );

    const entityServiceIdentifier = builders.identifier(
      `${entityNameToLower}Service`,
    );

    addInjectableDependency(
      classDeclaration,
      entityServiceIdentifier.name,
      builders.identifier(`${authEntity?.name}Service`),
      "protected",
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
