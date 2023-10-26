import {
  CreateServerDotEnvParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { convertToVarDict } from "@utils/convertToVarDict";
import { getPluginSettings } from "@utils/getPluginSettings";

export const beforeCreateServerDotEnv = (
  context: DsgContext,
  eventParams: CreateServerDotEnvParams,
): CreateServerDotEnvParams => {
  const { audience, issuerURL } = getPluginSettings(
    context.pluginInstallations,
  );

  const envVariables = {
    // Auth0
    AUTH0_AUDIENCE: audience,
    AUTH0_ISSUER_URL: issuerURL,
  };

  eventParams.envVariables = eventParams.envVariables.concat(
    convertToVarDict(envVariables),
  );

  return eventParams;
};
