import { Module, DsgContext } from "@amplication/code-gen-types";
import { join } from "path";
import { templatesPath } from "../constants";
import { readFile, print } from "@amplication/code-gen-utils";
import { builders } from "ast-types";
import { interpolate, removeTSClassDeclares } from "../util/ast";

const customSeedPath = join(templatesPath, "custom-seed.template.ts");

export async function createCustomSeed(
  dsgContext: DsgContext,
): Promise<Module> {
  const { entities, resourceInfo, serverDirectories } = dsgContext;
  const authEntity = entities?.find(
    (x) => x.name === resourceInfo?.settings.authEntityName,
  );
  if (!authEntity) {
    dsgContext.logger.error("Authentication entity does not exist");
    return { code: "", path: "" };
  }

  const template = await readFile(customSeedPath);

  const templateMapping = {
    ENTITY_NAME: builders.identifier(authEntity.name.toLocaleLowerCase()),
  };

  const filePath = `${serverDirectories.scriptsDirectory}/customSeed.ts`;

  interpolate(template, templateMapping);
  removeTSClassDeclares(template);

  return {
    code: print(template).code,
    path: filePath,
  };
}
