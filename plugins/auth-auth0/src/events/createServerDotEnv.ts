import { CreateServerDotEnvParams, DsgContext } from "@amplication/code-gen-types";
import { convertToVarDict } from "@utils/convertToVarDict";
import { getPluginSettings } from "@utils/getPluginSettings";

export const beforeCreateServerDotEnv = (
  context: DsgContext,
  eventParams: CreateServerDotEnvParams
) : CreateServerDotEnvParams => {
  const { AUTH0_AUDIENCE, AUTH0_ISSUER_URL } = getPluginSettings(
    context.pluginInstallations
  );

  const envVariables = {
    // Auth0
    AUTH0_AUDIENCE,
    AUTH0_ISSUER_URL,
  };

  eventParams.envVariables = eventParams.envVariables.concat(
    convertToVarDict(envVariables)
  );

  return eventParams;
};
