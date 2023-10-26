import {
  CreateAdminDotEnvParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { convertToVarDict } from "@utils/convertToVarDict";
import { getPluginSettings } from "@utils/getPluginSettings";

export const beforeCreateAdminDotEnv = (
  context: DsgContext,
  eventParams: CreateAdminDotEnvParams,
): CreateAdminDotEnvParams => {
  const { audience, clientId, domain } = getPluginSettings(
    context.pluginInstallations,
  );

  const envVariables = {
    // Auth0
    REACT_APP_AUTH0_DOMAIN: domain,
    REACT_APP_AUTH0_CLIENT_ID: clientId,
    REACT_APP_AUTH0_AUDIENCE: audience,
    REACT_APP_AUTH0_REDIRECT_URI: "http://localhost:3001/auth-callback",
    REACT_APP_AUTH0_LOGOUT_REDIRECT_URI: "http://localhost:3001/login",
    REACT_APP_AUTH0_SCOPE: "openid profile email",
  };

  eventParams.envVariables = eventParams.envVariables.concat(
    convertToVarDict(envVariables),
  );

  return eventParams;
};
