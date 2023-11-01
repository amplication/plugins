import {
  CreateServerDotEnvParams,
  DsgContext,
  VariableDictionary,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import AuthCorePlugin from "../index";

describe("Testing beforeCreateServerDotEnv hook", () => {
  let plugin: AuthCorePlugin;
  let context: DsgContext;
  let params: CreateServerDotEnvParams;

  beforeEach(() => {
    plugin = new AuthCorePlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
    params = { envVariables: [
        { dummy: "A dummy env variable" }
    ] };
  });
  it("should add the necessary environment variables", () => {
    const { envVariables } = plugin.beforeCreateServerDotEnv(context, params);
    const expectedEnvVars: VariableDictionary = [
        { dummy: "A dummy env variable" },
        { JWT_SECRET_KEY: "Change_ME!!!" },
        { JWT_EXPIRATION: "2d" }
    ];
    expect(envVariables).toStrictEqual(expectedEnvVars);
  });
});
