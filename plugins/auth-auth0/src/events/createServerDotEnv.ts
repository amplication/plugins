import {
  CreateServerDotEnvParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { Auth0Environment } from "@utils/automateAuth0";
import { convertToVarDict } from "@utils/convertToVarDict";
import { getPluginSettings } from "@utils/getPluginSettings";

export const beforeCreateServerDotEnv = async (
  context: DsgContext,
  eventParams: CreateServerDotEnvParams
): Promise<CreateServerDotEnvParams> => {
  const pluginSettings = getPluginSettings(context.pluginInstallations);

  let { audience, issuerURL } = pluginSettings;
  const { useManagementApi, managementParams } = pluginSettings;

  if (useManagementApi) {
    if (!managementParams?.accessToken) {
      context.logger.error(
        "Management API Access Token is required if you want to use the Management API.",
        {},
        "Kindly add the Management API Access Token in the plugin settings' managementParams field."
      );
      throw new Error("Auth0 environment creation failed.");
    }

    if (!managementParams?.identifier) {
      context.logger.error(
        "Management API Identifier is required if you want to use the Management API.",
        {},
        "Kindly add the Management API Identifier in the plugin settings' managementParams field."
      );
      throw new Error("Auth0 environment creation failed.");
    }

    ({ audience, issuerURL } = await Auth0Environment.getInstance({
      ...managementParams,
      jwtToken: managementParams.accessToken,
      logger: context.logger,
    }));
  }

  if (!audience || !issuerURL) {
    context.logger.error(
      "Audience and Issuer URL are required.",
      {},
      "Kindly add the Audience and Issuer URL in the plugin settings or provide the Management API Access Token and Identifier in the plugin settings' managementParams field, and make useManagementApi true."
    );
    throw new Error("Auth0 environment creation failed.");
  }

  const envVariables = {
    // Auth0
    AUTH0_AUDIENCE: audience,
    AUTH0_ISSUER_URL: issuerURL,
  };

  eventParams.envVariables = eventParams.envVariables.concat(
    convertToVarDict(envVariables)
  );

  return eventParams;
};
