import { DsgContext } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import RabbitMQBrokerPlugin from "../index";

describe("Testing beforeServerPackageJson", () => {
  let plugin: RabbitMQBrokerPlugin;
  let context: DsgContext;
  beforeEach(() => {
    plugin = new RabbitMQBrokerPlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
  });
  it("should add the dependencies required to use RabbitMQ to the package.json file", () => {
    const { updateProperties } = plugin.beforeCreateServerPackageJson(context, {
      fileContent: "",
      updateProperties: [{}],
    });
    expect(updateProperties).toStrictEqual([
      {
        dependencies: {
          "@nestjs/microservices": "10.2.7",
          "amqp-connection-manager": "^4.1.14",
          amqplib: "^0.10.3",
        },
      },
    ]);
  });
});
