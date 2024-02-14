import {
  BuildLogger,
  CreateMessageBrokerTopicsEnumParams,
  DsgContext,
  EnumMessagePatternConnectionOptions,
  ModuleMap,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { afterCreateTopicsEnum } from "../events";

describe("Testing the creation of topic subscription in controller", () => {
  let context: DsgContext;
  let logger: BuildLogger;
  let modules: ModuleMap;
  let eventParams: CreateMessageBrokerTopicsEnumParams;

  beforeEach(() => {
    eventParams = mock<CreateMessageBrokerTopicsEnumParams>();
    logger = mock<BuildLogger>();
    context = mock<DsgContext>({
      pluginInstallations: [
        {
          npm: "@amplication/plugin-broker-mqtt",
        },
      ],
      serverDirectories: {
        srcDirectory: "src",
        messageBrokerDirectory: "default-message-broker",
      },
      serviceTopics: [],
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
      },
      otherResources: [],
    });
    modules = new ModuleMap(logger);
  });

  it("should create a controller without topics if no resources are found", async () => {
    await afterCreateTopicsEnum(context, eventParams, modules);
    expect(modules.modules()).toMatchSnapshot();
  });

  it("should create a controller with topics if resources are found", async () => {
    context.serviceTopics = [
      {
        enabled: true,
        id: "test-topic-id",
        messageBrokerId: "test-broker-id",
        patterns: [
          {
            type: EnumMessagePatternConnectionOptions.Receive,
            topicId: "test-topic-id",
            topicName: "test-topic-name",
          },
          {
            type: EnumMessagePatternConnectionOptions.Send,
            topicId: "should-not-be-added",
            topicName: "should-not-be-added",
          },
          {
            type: EnumMessagePatternConnectionOptions.Receive,
            topicId: "should-be-added",
            topicName: "should-be-added",
          },
        ],
      },
    ];

    await afterCreateTopicsEnum(context, eventParams, modules);
    expect(modules.modules()).toMatchSnapshot();
  });

  it("should throw an error if no topic name is found", async () => {
    context.serviceTopics = [
      {
        enabled: true,
        id: "test-topic-id",
        messageBrokerId: "test-broker-id",
        patterns: [
          {
            type: EnumMessagePatternConnectionOptions.Receive,
            topicId: "test-topic-id",
          },
        ],
      },
    ];

    await expect(
      afterCreateTopicsEnum(context, eventParams, modules),
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});
