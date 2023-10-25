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
  const { AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_DOMAIN } = getPluginSettings(
    context.pluginInstallations,
  );

  const envVariables = {
    // Auth0
    REACT_APP_AUTH0_DOMAIN: AUTH0_DOMAIN,
    REACT_APP_AUTH0_CLIENT_ID: AUTH0_CLIENT_ID,
    REACT_APP_AUTH0_AUDIENCE: AUTH0_AUDIENCE,
    REACT_APP_AUTH0_REDIRECT_URI: "http://localhost:3001/auth-callback",
    REACT_APP_AUTH0_LOGOUT_REDIRECT_URI: "http://localhost:3001/login",
    REACT_APP_AUTH0_SCOPE: "openid profile email",
  };

  eventParams.envVariables = eventParams.envVariables.concat(
    convertToVarDict(envVariables),
  );

  return eventParams;
};
