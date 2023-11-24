import {
  CreateAdminDotEnvParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { Auth0Environment } from "@utils/automateAuth0";
import { convertToVarDict } from "@utils/convertToVarDict";
import { getPluginSettings } from "@utils/getPluginSettings";

export const beforeCreateAdminDotEnv = async (
  context: DsgContext,
  eventParams: CreateAdminDotEnvParams,
): Promise<CreateAdminDotEnvParams> => {
  const settings = getPluginSettings(context.pluginInstallations);

  let { domain, clientID, audience } = settings;
  const { useManagementApi, managementParams } = settings;

  if (useManagementApi) {
    if (!managementParams?.accessToken) {
      context.logger.error(
        "Management API Access Token is required if you want to use the Management API.",
        {},
        "Kindly add the Management API Access Token in the plugin settings' managementParams field.",
      );
      throw new Error("Auth0 environment creation failed.");
    }

    if (!managementParams?.identifier) {
      context.logger.error(
        "Management API Identifier is required if you want to use the Management API.",
        {},
        "Kindly add the Management API Identifier in the plugin settings' managementParams field.",
      );
      throw new Error("Auth0 environment creation failed.");
    }

    ({ audience, clientID, domain } = await Auth0Environment.getInstance({
      ...managementParams,
      jwtToken: managementParams.accessToken,
      logger: context.logger,
    }));
  }

  if (!domain || !clientID || !audience) {
    context.logger.error(
      "Domain, Client ID and Audience are required.",
      {},
      "Kindly add the Domain, Client ID and Audience in the plugin settings or use the Management API by providing the Management API Access Token and Identifier in the plugin settings' managementParams field, and make useManagementApi true.",
    );
    throw new Error("Auth0 environment creation failed.");
  }

  const envVariables = {
    // Auth0
    REACT_APP_AUTH0_DOMAIN: domain,
    REACT_APP_AUTH0_CLIENT_ID: clientID,
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
