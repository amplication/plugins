import {
  CreateServerDotEnvParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { beforeCreateServerDotEnv } from "../events";
import { mock } from "jest-mock-extended";

describe("Testing beforeCreateServerDotEnv hook", () => {
  let context: DsgContext;
  let eventParams: CreateServerDotEnvParams;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [
        {
          npm: "@amplication/plugin-auth-keycloak",
        },
      ],
    });
    eventParams = mock<CreateServerDotEnvParams>({
      envVariables: [],
    });
  });

  it("should use default values if plugin settings are not defined", async () => {
    eventParams = await beforeCreateServerDotEnv(context, eventParams);

    const expectedEnvVariables = [
      { KEYCLOAK_URL: "http://localhost:8080" },
      { KEYCLOAK_REALM: "amplication-sample-realm" },
      { KEYCLOAK_CLIENT_ID: "amplication-server" },
      { KEYCLOAK_ADMIN_USERNAME: "admin" },
      { KEYCLOAK_ADMIN_PASSWORD: "password" },
      { KEYCLOAK_PORT: "8080" },
    ];

    expect(eventParams.envVariables).toEqual(expectedEnvVariables);
  });

  it("should use plugin settings if defined", async () => {
    context.pluginInstallations[0].settings = {
      port: 3000,
      realmID: "CUSTOM_KEYCLOAK_REALM_ID",
      clientID: "CUSTOM_KEYCLOAK_CLIENT_ID",
      adminUsername: "CUSTOM_KEYCLOAK_ADMIN_USERNAME",
      adminPassword: "CUSTOM_KEYCLOAK_ADMIN_PASSWORD",
    };

    eventParams = await beforeCreateServerDotEnv(context, eventParams);

    const expectedEnvVariables = [
      { KEYCLOAK_URL: "http://localhost:3000" },
      { KEYCLOAK_REALM: "CUSTOM_KEYCLOAK_REALM_ID" },
      { KEYCLOAK_CLIENT_ID: "CUSTOM_KEYCLOAK_CLIENT_ID" },
      { KEYCLOAK_ADMIN_USERNAME: "CUSTOM_KEYCLOAK_ADMIN_USERNAME" },
      { KEYCLOAK_ADMIN_PASSWORD: "CUSTOM_KEYCLOAK_ADMIN_PASSWORD" },
      { KEYCLOAK_PORT: "3000" },
    ];

    expect(eventParams.envVariables).toEqual(expectedEnvVariables);
  });
});
