import { CreateSeedParams, DsgContext } from "@amplication/code-gen-types";
import { join } from "path";
import {
  AUTH_ENTITY_ERROR,
  AUTH_ENTITY_LOG_ERROR,
  templatesPath,
} from "../constants";
import { builders } from "ast-types";
import { readFile } from "@amplication/code-gen-utils";
import { getPluginSettings } from "../utils/getPluginSettings";
import { createAuthEntityObjectCustomProperties } from "../utils/createAuthProperties";

const seedTemplatePath = join(templatesPath, "seed.template.ts");

export const beforeCreateSeed = async (
  context: DsgContext,
  eventParams: CreateSeedParams
): Promise<CreateSeedParams> => {
  const { entities, resourceInfo, logger } = context;

  logger.info("Creating seed file from Default Values...");

  const { defaultUser } = getPluginSettings(context.pluginInstallations);
  const authEntity = entities?.find(
    (x) => x.name === resourceInfo?.settings.authEntityName
  );

  if (!authEntity) {
    context.logger.error(AUTH_ENTITY_LOG_ERROR);
    throw new Error(AUTH_ENTITY_ERROR);
  }

  const template = await readFile(seedTemplatePath);
  const seedProperties = createAuthEntityObjectCustomProperties(
    authEntity,
    defaultUser || {}
  );

  const templateMapping = {
    DATA: builders.objectExpression(seedProperties),
  };

  return {
    ...eventParams,
    template,
    templateMapping,
  };
};
