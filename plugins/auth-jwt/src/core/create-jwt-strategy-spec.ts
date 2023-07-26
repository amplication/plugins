import { Module, DsgContext } from "@amplication/code-gen-types";
import { join } from "path";
import { templatesPath } from "../constants";
import { readFile } from "@amplication/code-gen-utils";
import {
  addImports,
  importNames,
  interpolate,
  removeTSClassDeclares,
} from "../util/ast";
import { builders, namedTypes } from "ast-types";
import { print } from "@amplication/code-gen-utils";

const jwtStrategySpecPath = join(
  templatesPath,
  "jwt.strategy.template.spec.ts"
);

export async function createJwtStrategySpec(
  dsgContext: DsgContext
): Promise<Module> {
  return await mapJwtStrategySpecTemplate(
    dsgContext,
    jwtStrategySpecPath,
    "jwt.strategy.spec.ts"
  );
}

async function mapJwtStrategySpecTemplate(
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

  const entityServiceName = `${authEntity?.name}Service`;
  const entityNameToLower = authEntity.name.toLowerCase();

  const template = await readFile(templatePath);
  const authServiceNameId = builders.identifier(entityServiceName);

  const entityServiceImport = importNames(
    [authServiceNameId],
    `../../../${entityNameToLower}/${entityNameToLower}.service`
  );

  addImports(
    template,
    [entityServiceImport].filter(
      (x) => x //remove nulls and undefined
    ) as namedTypes.ImportDeclaration[]
  );

  const templateMapping = {
    ENTITY_SERVICE: builders.identifier(`${entityServiceName}`),
  };

  const filePath = `${serverDirectories.srcDirectory}/tests/auth/jwt/${fileName}`;

  interpolate(template, templateMapping);

  removeTSClassDeclares(template);

  return {
    code: print(template).code,
    path: filePath,
  };
}
