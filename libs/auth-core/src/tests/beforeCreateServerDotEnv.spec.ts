import {
  CreateServerDotEnvParams,
  DsgContext,
  VariableDictionary,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import { beforeCreateServerDotEnv } from "../events/create-server-dotenv";

describe("Testing beforeCreateServerDotEnv hook", () => {
  let context: DsgContext;
  let params: CreateServerDotEnvParams;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
    params = { envVariables: [{ dummy: "A dummy env variable" }] };
  });
  it("should add the necessary environment variables", () => {
    const { envVariables } = beforeCreateServerDotEnv(context, params);
    const expectedEnvVars: VariableDictionary = [
      { dummy: "A dummy env variable" },
      { JWT_SECRET_KEY: "Change_ME!!!" },
      { JWT_EXPIRATION: "2d" },
    ];
    expect(envVariables).toStrictEqual(expectedEnvVars);
  });
});
