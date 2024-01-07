import {
  CreateServerDotEnvParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import TransportHttpsPlugin from "..";

describe("Testing beforeCreateServerDotEnv hook", () => {
  let context: DsgContext;
  let eventParams: CreateServerDotEnvParams;
  const plugin = new TransportHttpsPlugin();

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [
        {
          npm: "@amplication/plugin-transport-https",
        },
      ],
    });
    eventParams = mock<CreateServerDotEnvParams>({
      envVariables: [],
    });
  });

  it("should use default values if plugin settings are not defined", async () => {
    eventParams = await plugin.beforeCreateServerDotEnv(context, eventParams);

    const expectedEnvVariables = [
      { APP_MODE: "both" },
      { HTTPS_PORT: "443" },
      { SSL_CERT_PATH: "./.certs/server.crt" },
      { SSL_KEY_PATH: "./.certs/server.key" },
      { CA_CERT_PATH: "./.certs/ca.crt" },
    ];

    expect(eventParams.envVariables).toEqual(expectedEnvVariables);
  });

  it("should use plugin settings if defined", async () => {
    context.pluginInstallations[0].settings = {
      appMode: "https",
      httpsPort: 8443,
      httpsCertName: "custom-server.crt",
      httpsKeyName: "custom-server.key",
      httpsCertDir: "custom-certs",
      caKeyName: "custom-ca.key",
      caCertName: "custom-ca.crt",
    };

    eventParams = await plugin.beforeCreateServerDotEnv(context, eventParams);

    const expectedEnvVariables = [
      { APP_MODE: "https" },
      { HTTPS_PORT: "8443" },
      { SSL_CERT_PATH: "./custom-certs/custom-server.crt" },
      { SSL_KEY_PATH: "./custom-certs/custom-server.key" },
      { CA_CERT_PATH: "./custom-certs/custom-ca.crt" },
    ];

    expect(eventParams.envVariables).toEqual(expectedEnvVariables);
  });
});
