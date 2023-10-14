import { CreateServerDotEnvParams, DsgContext } from "@amplication/code-gen-types";
import KeycloakAuthPlugin from "../index";
import { mock } from "jest-mock-extended";

describe("Testing beforeCreateServerDotEnv Event", () => {
  let context: DsgContext;
  let eventParams: CreateServerDotEnvParams;

  beforeEach(() => {
    context = mock < DsgContext > ({
      pluginInstallations: [{
        npm: "@amplication/plugin-auth-keycloak",
      }],
    });
    eventParams = mock < CreateServerDotEnvParams > ({
      envVariables: [],
    });
  });

  it("should use default values if plugin settings are not defined", () => {
    eventParams = new KeycloakAuthPlugin().beforeCreateServerDotEnv(context, eventParams);

    const expectedEnvVariables = [
      { KEYCLOAK_HOST: "localhost" },
      { KEYCLOAK_REALM: "test-realm" },
      { KEYCLOAK_CLIENT_ID: "test-client" },
      { KEYCLOAK_CLIENT_SECRET: "pryUAZxDplBlJmRfCZ8yxH2NT1Dcad5H" },
      { KEYCLOAK_CALLBACK_URL: "http://localhost:3000/api/callback" }
    ];

    expect(eventParams.envVariables).toEqual(expectedEnvVariables);
  });

  it("should use plugin settings if defined", () => {
    context.pluginInstallations[0].settings = {
      KEYCLOAK_HOST: "localhost-custom",
      KEYCLOAK_REALM: "test-realm-custom",
      KEYCLOAK_CLIENT_ID: "test-client-custom",
      KEYCLOAK_CLIENT_SECRET: "pryUAZxDplBlJmRfCZ8yxH2NT1Dcad5H-custom",
      KEYCLOAK_CALLBACK_URL: "http://localhost:3000/api/callback-custom" 
    };

    eventParams = new KeycloakAuthPlugin().beforeCreateServerDotEnv(context, eventParams);

    const expectedEnvVariables = [
      { KEYCLOAK_HOST: "localhost-custom" },
      { KEYCLOAK_REALM: "test-realm-custom" },
      { KEYCLOAK_CLIENT_ID: "test-client-custom" },
      { KEYCLOAK_CLIENT_SECRET: "pryUAZxDplBlJmRfCZ8yxH2NT1Dcad5H-custom" },
      { KEYCLOAK_CALLBACK_URL: "http://localhost:3000/api/callback-custom" }
    ];

    expect(eventParams.envVariables).toEqual(expectedEnvVariables);
  });
});