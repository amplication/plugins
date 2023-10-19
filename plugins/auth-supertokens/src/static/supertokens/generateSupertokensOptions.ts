import { ConfigService } from "@nestjs/config";
import { AuthModuleConfig } from "./config.interface";

export const generateSupertokensOptions = (
  configService: ConfigService
): AuthModuleConfig => {
  const connectionURI = configService.get("SUPERTOKENS_CONNECTION_URI");
  const appName = configService.get("SUPERTOKENS_APP_NAME");
  const apiDomain = configService.get("SUPERTOKENS_API_DOMAIN");
  const websiteDomain = configService.get("SUPERTOKENS_WEBSITE_DOMAIN");
  let apiBasePath = configService.get("SUPERTOKENS_API_BASE_PATH");
  let websiteBasePath = configService.get("SUPERTOKENS_WEBSITE_BASE_PATH");
  let apiKey = configService.get("SUPERTOKENS_API_KEY");
  let apiGatewayPath = configService.get("SUPERTOKENS_API_GATEWAY_PATH");

  if (!connectionURI) {
    throw new Error(
      "SUPERTOKENS_CONNECTION_URI environment variable must be defined"
    );
  }

  if (!appName) {
    throw new Error(
      "SUPERTOKENS_APP_NAME environment variable must be defined"
    );
  }

  if (!websiteDomain) {
    throw new Error(
      "SUPERTOKENS_WEBSITE_DOMAIN environment variable must be defined"
    );
  }

  if (!apiDomain) {
    throw new Error(
      "SUPERTOKENS_API_DOMAIN environment variable must be defined"
    );
  }

  if (apiBasePath !== undefined && apiBasePath.length === 0) {
    apiBasePath = undefined;
  }

  if (websiteBasePath !== undefined && websiteBasePath.length === 0) {
    websiteBasePath = undefined;
  }

  if (apiKey !== undefined && apiKey.length === 0) {
    apiKey = undefined;
  }

  if (apiGatewayPath !== undefined && apiGatewayPath.length === 0) {
    apiGatewayPath = undefined;
  }

  return {
    supertokens: {
      connectionURI,
      apiKey,
    },
    appInfo: {
      appName,
      apiDomain,
      websiteDomain,
      apiBasePath,
      websiteBasePath,
      apiGatewayPath,
    },
  };
};
