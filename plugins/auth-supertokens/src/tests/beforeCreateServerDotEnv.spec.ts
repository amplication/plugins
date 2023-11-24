import {
  BuildLogger,
  CreateServerDotEnvParams,
  DsgContext,
  VariableDictionary,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import SupertokensAuthPlugin from "../index";
import * as utils from "../utils";
import { settings as defaultSettings } from "../../.amplicationrc.json";
import { Settings } from "../types";

describe("Testing beforeCreateServerDotEnv hook", () => {
  let plugin: SupertokensAuthPlugin;
  let context: DsgContext;
  let params: CreateServerDotEnvParams;

  beforeEach(() => {
    plugin = new SupertokensAuthPlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
      logger: mock<BuildLogger>(),
    });
    params = { envVariables: [] };
  });
  it("should use the default settings when no user settings are specified", () => {
    context.pluginInstallations[0].settings = {};
    const { envVariables } = plugin.beforeCreateServerDotEnv(context, params);
    const expectedEnvVars: VariableDictionary = utils.settingsToVarDict(
      defaultSettings as any,
    );
    expectedEnvVars.sort(envVarSortCmpFunc);
    envVariables.sort(envVarSortCmpFunc);
    expect(envVariables).toStrictEqual(expectedEnvVars);
  });
  it("should use the user specified settings when the user specifies them", () => {
    const userSpecifiedSettings: Settings = {
      apiBasePath: "/basepath/",
      apiDomain: "https://api.site.com",
      apiGatewayPath: "https://thegateway.com",
      appName: "An Awesome App",
      websiteBasePath: "/site/path",
      websiteDomain: "https://app.site.com",
      connectionUri: "https://supertokens.site.com",
      apiKey: "THEKey!",
      supertokensIdFieldName: "supetokensId",
      recipe: {
        name: "emailpassword",
      },
    };
    context.pluginInstallations[0].settings = userSpecifiedSettings;
    const { envVariables } = plugin.beforeCreateServerDotEnv(context, params);
    const expectedEnvVars = utils.settingsToVarDict(userSpecifiedSettings);
    envVariables.sort(envVarSortCmpFunc);
    expectedEnvVars.sort(envVarSortCmpFunc);
    expect(envVariables).toStrictEqual(expectedEnvVars);
  });
});

const envVarSortCmpFunc = (a: EnvVar, b: EnvVar) =>
  Object.keys(a)[0] < Object.keys(b)[0] ? -1 : 1;

type EnvVar = Partial<Settings>;
