import {
  CreateServerDotEnvParams,
  DsgContext,
  VariableDictionary,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import RabbitMQBrokerPlugin from "../index";

describe("Testing beforeCreateServerDotEnv", () => {
  let plugin: RabbitMQBrokerPlugin;
  let context: DsgContext;
  let params: CreateServerDotEnvParams;

  beforeEach(() => {
    plugin = new RabbitMQBrokerPlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
      resourceInfo: {
        name: "sample-application",
      },
    });
    params = { envVariables: [] };
  });

  it("should add the env variables", () => {
    const { envVariables } = plugin.beforeCreateServerDotEnv(context, params);
    expect(envVariables).toStrictEqual([
      { RABBITMQ_URLS: "amqp://user:password@localhost:5672" },
      { RABBITMQ_QUEUE: "sample-application" },
    ]);
  });
});
