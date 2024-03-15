import {
  CreateMessageBrokerNestJSModuleParams,
  DsgContext,
} from "@amplication/code-gen-types";
import RabbitMQPlugin from "../index";
import { mock } from "jest-mock-extended";
import * as utils from "../util/ast";
import path from "path";

describe("Testing afterCreateMessageBrokerClientOptionsFactory", () => {
  let plugin: RabbitMQPlugin;
  let context: DsgContext;
  let params: CreateMessageBrokerNestJSModuleParams;

  beforeEach(() => {
    plugin = new RabbitMQPlugin();
    context = fakeContext();
    params = mock<CreateMessageBrokerNestJSModuleParams>();
  });

  it("should correctly add the code for generating rabbitmq Client Options", async () => {
    const modules = await plugin.afterCreateMessageBrokerClientOptionsFactory(
      context,
      params
    );

    const rabbitMqClientOptionsModule = modules.get(
      path.join("/", "generateRabbitMQClientOptions.ts")
    );
    const rabbitMqClientOptionsCode = utils.print(
      utils.parse(rabbitMqClientOptionsModule.code)
    ).code;
    const expectedRabbitMqClientOptionsCode = utils.print(
      utils.parse(expectedRabbitMqClientOptions)
    ).code;

    expect(rabbitMqClientOptionsCode).toStrictEqual(
      expectedRabbitMqClientOptionsCode
    );
  });
});

const expectedRabbitMqClientOptions = `import { ConfigService } from "@nestjs/config";
import { RmqOptions, Transport } from "@nestjs/microservices";

export const generateRabbitMQClientOptions = (
  configService: ConfigService,
  topic?: string
): RmqOptions => {
  const RabbitMQUrlStrings = configService.get("RABBITMQ_URLS");

  if (!RabbitMQUrlStrings) {
    throw new Error("RABBITMQ_URLS environment variable must be defined");
  }
  
  return {
    transport: Transport.RMQ,
    options: {
      urls: [...RabbitMQUrlStrings.split(",")],
      queue: topic,
      queueOptions: {
        consumerGroupId: configService.get("RABBITMQ_SUBSCRIBE_GROUP"),
        noAssert: topic ? false : true, // If topic is not defined, then the queue is not created
      },
    },
  };
};
`;

const fakeContext = () => {
  return mock<DsgContext>({
    logger: {
      warn: async (
        message: string,
        params?: Record<string, unknown>,
        userFriendlyMessage?: string
      ) => {
        console.log("Warning!", userFriendlyMessage);
      },
    },
    serverDirectories: {
      messageBrokerDirectory: "/",
    },
  });
};
