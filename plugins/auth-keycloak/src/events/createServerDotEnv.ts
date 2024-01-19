import {
  CreateServerDotEnvParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { convertToVarDict } from "../utils/convertToVarDict";
import { getPluginSettings } from "../utils/getPluginSettings";

export const beforeCreateServerDotEnv = async (
  context: DsgContext,
  eventParams: CreateServerDotEnvParams,
): Promise<CreateServerDotEnvParams> => {
  const pluginSettings = getPluginSettings(context.pluginInstallations);

  const { port, realmID, clientID, adminPassword, adminUsername } =
    pluginSettings;

  const envVariables = {
    // Keycloak
    KEYCLOAK_URL: `http://localhost:${port}`,
    KEYCLOAK_REALM: realmID,
    KEYCLOAK_CLIENT_ID: clientID,
    KEYCLOAK_ADMIN_USERNAME: adminUsername || "admin",
    KEYCLOAK_ADMIN_PASSWORD: adminPassword || "password",
    KEYCLOAK_PORT: port.toString(),
  };

  eventParams.envVariables = eventParams.envVariables.concat(
    convertToVarDict(envVariables),
  );

  return eventParams;
};
