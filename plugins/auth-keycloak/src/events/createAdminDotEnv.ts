import {
  CreateAdminDotEnvParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { convertToVarDict } from "../utils/convertToVarDict";
import { getPluginSettings } from "../utils/getPluginSettings";

export const beforeCreateAdminDotEnv = async (
  context: DsgContext,
  eventParams: CreateAdminDotEnvParams,
): Promise<CreateAdminDotEnvParams> => {
  const settings = getPluginSettings(context.pluginInstallations);

  const { port, realmID, clientID } = settings;

  const envVariables = {
    // Keycloak
    REACT_APP_KEYCLOAK_URL: `http://localhost:${port}`,
    REACT_APP_KEYCLOAK_REALM: realmID,
    REACT_APP_KEYCLOAK_CLIENT_ID: clientID,
  };

  eventParams.envVariables = eventParams.envVariables.concat(
    convertToVarDict(envVariables),
  );

  return eventParams;
};
