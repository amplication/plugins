import {
  CreateServerAuthParams,
  DsgContext,
  EnumMessagePatternConnectionOptions,
  ModuleMap,
} from "@amplication/code-gen-types";
import RabbitMQPlugin from "../index";
import { mock } from "jest-mock-extended";
import * as utils from "../util/ast";
import path from "path";
import { afterCreateServer } from "../events";

describe("Testing afterCreateServer", () => {
  let plugin: RabbitMQPlugin;
  let context: DsgContext;
  let params: CreateServerAuthParams;
  let moduleMap: ModuleMap;

  beforeEach(() => {
    plugin = new RabbitMQPlugin();
    context = fakeContext();
    params = mock<CreateServerAuthParams>();
    moduleMap = new ModuleMap(context.logger);
  });

  it("should correctly add the code for generating rabbitmq controller", async () => {
    const modules = await afterCreateServer(context, params, moduleMap);

    const controllerModule = modules.get(
      path.join("/", "rabbitmq.controller.ts")
    );
    const controllerCode = utils.print(utils.parse(controllerModule.code)).code;
    const expectedControllerCode = utils.print(
      utils.parse(expectedController)
    ).code;
    expect(controllerCode).toStrictEqual(expectedControllerCode);
  });
});

const expectedController = `import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";
import { RabbitMQMessage } from "./RabbitMQMessage";
import { Controller, Logger } from "@nestjs/common";

@Controller("rabbitmq-controller")
export class RabbitMQController {
  private readonly logger = new Logger(RabbitMQController.name);

  @EventPattern("theFirstTopicInTheFirstBroker")
  async onTheFirstTopicInTheFirstBroker(
    @Payload()
    message: RabbitMQMessage,
    @Ctx()
    context: RmqContext
  ): Promise<void> {}

  @EventPattern("theFirstTopicInTheSecondBroker")
  async onTheFirstTopicInTheSecondBroker(
    @Payload()
    message: RabbitMQMessage,
    @Ctx()
    context: RmqContext
  ): Promise<void> {}
}
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
    pluginInstallations: [{}],
    serverDirectories: {
      srcDirectory: "/",
      messageBrokerDirectory: "/",
    },
    serviceTopics: [
      {
        id: "first-broker-first-service-topic",
        enabled: true,
        messageBrokerId: "first-broker-id",
        patterns: [
          {
            topicId: "first-service-topic-first-topic",
            topicName: "theFirstTopicInTheFirstBroker",
            type: EnumMessagePatternConnectionOptions.Receive,
          },
          {
            topicId: "first-service-topic-second-topic",
            topicName: "theSecondTopicInTheFirstBroker",
            type: EnumMessagePatternConnectionOptions.Send,
          },
        ],
      },
      {
        id: "second-broker-first-service-topic",
        enabled: true,
        messageBrokerId: "second-broker-id",
        patterns: [
          {
            topicId: "second-service-topic-first-topic",
            topicName: "theFirstTopicInTheSecondBroker",
            type: EnumMessagePatternConnectionOptions.Receive,
          },
        ],
      },
    ],
    otherResources: [
      {
        resourceType: "MessageBroker",
        buildId: "abuildid",
        pluginInstallations: [],
        roles: [],
        entities: [],
        topics: [
          {
            resourceId: "first-broker-first-topic",
            id: "first-service-topic-first-topic",
            name: "theFirstTopicInTheFirstBroker",
          },
          {
            resourceId: "first-broker-second-topic",
            id: "first-service-topic-second-topic",
            name: "theSecondTopicInTheFirstBroker",
          },
        ],
        resourceInfo: {
          name: "firstMessageBroker",
          description: "This resource is used to store project configuration.",
          version: "1.0",
          id: "first-broker-id",
          url: "http://localhost:3000/first-broker-id",
        },
      },
      {
        resourceType: "MessageBroker",
        buildId: "abuildid",
        pluginInstallations: [],
        roles: [],
        entities: [],
        topics: [
          {
            resourceId: "second-broker-first-topic",
            id: "second-service-topic-first-topic",
            name: "theFirstTopicInTheSecondBroker",
          },
        ],
        resourceInfo: {
          name: "secondMessageBroker",
          description: "This resource is used to store project configuration.",
          version: "1.0",
          id: "second-broker-id",
          url: "http://localhost:3000/second-broker-id",
        },
      },
    ],
  });
};
