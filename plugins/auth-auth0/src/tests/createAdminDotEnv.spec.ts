import {
  CreateAdminDotEnvParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { beforeCreateAdminDotEnv } from "@events/index";
import { mock } from "jest-mock-extended";

describe("Testing beforeCreateAdminDotEnv hook", () => {
  let context: DsgContext;
  let eventParams: CreateAdminDotEnvParams;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [
        {
          npm: "@amplication/plugin-auth-auth0",
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
      { REACT_APP_AUTH0_DOMAIN: "AUTH0_DOMAIN" },
      { REACT_APP_AUTH0_CLIENT_ID: "AUTH0_CLIENT_ID" },
      { REACT_APP_AUTH0_AUDIENCE: "AUTH0_AUDIENCE" },
      {
        REACT_APP_AUTH0_REDIRECT_URI: "http://localhost:3001/auth-callback",
      },
      {
        REACT_APP_AUTH0_LOGOUT_REDIRECT_URI: "http://localhost:3001/login",
      },
      { REACT_APP_AUTH0_SCOPE: "openid profile email" },
    ];

    expect(eventParams.envVariables).toEqual(expectedEnvVariables);
  });

  it("should use plugin settings if defined", async () => {
    context.pluginInstallations[0].settings = {
      domain: "CUSTOM_AUTH0_DOMAIN",
      clientID: "CUSTOM_AUTH0_CLIENT_ID",
      audience: "CUSTOM_AUTH0_AUDIENCE",
    };

    eventParams = await beforeCreateAdminDotEnv(context, eventParams);

    const expectedEnvVariables = [
      { REACT_APP_AUTH0_DOMAIN: "CUSTOM_AUTH0_DOMAIN" },
      { REACT_APP_AUTH0_CLIENT_ID: "CUSTOM_AUTH0_CLIENT_ID" },
      { REACT_APP_AUTH0_AUDIENCE: "CUSTOM_AUTH0_AUDIENCE" },
      {
        REACT_APP_AUTH0_REDIRECT_URI: "http://localhost:3001/auth-callback",
      },
      {
        REACT_APP_AUTH0_LOGOUT_REDIRECT_URI: "http://localhost:3001/login",
      },
      { REACT_APP_AUTH0_SCOPE: "openid profile email" },
    ];

    expect(eventParams.envVariables).toEqual(expectedEnvVariables);
  });
});
