import {
  CreateServerDotEnvParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { beforeCreateServerDotEnv } from "@events/createServerDotEnv";
import { mock } from "jest-mock-extended";

describe("Testing beforeCreateServerDotEnv hook", () => {
  let context: DsgContext;
  let eventParams: CreateServerDotEnvParams;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [
        {
          npm: "@amplication/plugin-auth-auth0",
        },
      ],
    });
    eventParams = mock<CreateServerDotEnvParams>({
      envVariables: [],
    });
  });

  it("should use default values if plugin settings are not defined", () => {
    eventParams = beforeCreateServerDotEnv(context, eventParams);

    const expectedEnvVariables = [
      { AUTH0_AUDIENCE: "AUTH0_AUDIENCE" },
      { AUTH0_ISSUER_URL: "AUTH0_ISSUER_URL" },
    ];

    expect(eventParams.envVariables).toEqual(expectedEnvVariables);
  });

  it("should use plugin settings if defined", () => {
    context.pluginInstallations[0].settings = {
      audience: "CUSTOM_AUTH0_AUDIENCE",
      issuerURL: "CUSTOM_AUTH0_ISSUER_URL",
    };

    eventParams = beforeCreateServerDotEnv(context, eventParams);

    const expectedEnvVariables = [
      { AUTH0_AUDIENCE: "CUSTOM_AUTH0_AUDIENCE" },
      { AUTH0_ISSUER_URL: "CUSTOM_AUTH0_ISSUER_URL" },
    ];

    expect(eventParams.envVariables).toEqual(expectedEnvVariables);
  });
});
