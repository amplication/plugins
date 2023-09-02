import { ConfigService } from "@nestjs/config";
import { AuthModuleConfig } from "./config.interface";
import { recipeList } from "./recipes"

export const generateSupertokensOptions = (
  configService: ConfigService
): AuthModuleConfig => {
  const connectionURI = configService.get("SUPERTOKENS_CONNECTION_URI");
  const appName = configService.get("SUPERTOKENS_APP_NAME");
  const apiDomain = configService.get("SUPERTOKENS_API_DOMAIN");
  const websiteDomain = configService.get("SUPERTOKENS_WEBSITE_DOMAIN");
  const apiBasePath = configService.get("SUPERTOKENS_API_BASE_PATH");
  const websiteBasePath = configService.get("SUPERTOKENS_WEBSITE_BASE_PATH");
  const apiKey = configService.get("SUPERTOKENS_API_KEY");
  const apiGatewayPath = configService.get("SUPERTOKENS_API_GATEWAY_PATH");

  if(!connectionURI) {
    throw new Error("SUPERTOKENS_CONNECTION_URI environment variable must be defined");
  }

  if(!appName) {
    throw new Error("SUPERTOKENS_APP_NAME environment variable must be defined");
  }

  if(!websiteDomain) {
    throw new Error("SUPERTOKENS_WEBSITE_DOMAIN environment variable must be defined");
  }

  if(!apiDomain) {
    throw new Error("SUPERTOKENS_API_DOMAIN environment variable must be defined");
  }



  return {
    connectionURI,
    apiKey,
    appInfo: {
      appName,
      apiDomain,
      websiteDomain,
      apiBasePath,
      websiteBasePath,
      apiGatewayPath
    },
    recipeList
  }
};
