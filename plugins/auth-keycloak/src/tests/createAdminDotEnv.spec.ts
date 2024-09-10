import {
  CreateAdminDotEnvParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { beforeCreateAdminDotEnv } from "../events";
import { mock } from "jest-mock-extended";

describe("Testing beforeCreateAdminDotEnv hook", () => {
  let context: DsgContext;
  let eventParams: CreateAdminDotEnvParams;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [
        {
          npm: "@amplication/plugin-auth-keycloak",
        },
      ],
    });
    eventParams = mock<CreateAdminDotEnvParams>({
      envVariables: [],
    });
  });

  it("should use default values if plugin settings are not defined", async () => {
    eventParams = await beforeCreateAdminDotEnv(context, eventParams);

    const expectedEnvVariables = [
      { VITE_REACT_APP_KEYCLOAK_URL: "http://localhost:8080" },
      { VITE_REACT_APP_KEYCLOAK_REALM: "amplication-sample-realm" },
      { VITE_REACT_APP_KEYCLOAK_CLIENT_ID: "amplication-server" },
    ];

    expect(eventParams.envVariables).toEqual(expectedEnvVariables);
  });

  it("should use plugin settings if defined", async () => {
    context.pluginInstallations[0].settings = {
      port: 3000,
      realmID: "CUSTOM_KEYCLOAK_REALM_ID",
      clientID: "CUSTOM_KEYCLOAK_CLIENT_ID",
    };
    eventParams = await beforeCreateAdminDotEnv(context, eventParams);

    const expectedEnvVariables = [
      { VITE_REACT_APP_KEYCLOAK_URL: "http://localhost:3000" },
      { VITE_REACT_APP_KEYCLOAK_REALM: "CUSTOM_KEYCLOAK_REALM_ID" },
      { VITE_REACT_APP_KEYCLOAK_CLIENT_ID: "CUSTOM_KEYCLOAK_CLIENT_ID" },
    ];

    expect(eventParams.envVariables).toEqual(expectedEnvVariables);
  });
});
