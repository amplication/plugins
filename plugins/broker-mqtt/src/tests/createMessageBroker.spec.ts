import {
  BuildLogger,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import {
  afterCreateMessageBrokerClientOptionsFactory,
  afterCreateMessageBrokerNestJSModule,
  afterCreateMessageBrokerService,
} from "../events";
import MQTTBrokerPlugin from "..";
import { EnumAuthProviderType } from "@amplication/code-gen-types/src/models";

describe("Testing the creation of message broker modules and files", () => {
  let context: DsgContext;
  let logger: BuildLogger;
  let plugin: MQTTBrokerPlugin;

  beforeEach(() => {
    plugin = new MQTTBrokerPlugin();
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
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
      },
      otherResources: [],
    });
  });

  it("all modules and files should be created with default values", async () => {
    const modules = new ModuleMap(logger);
    plugin.beforeCreateBroker(context, modules);
    const brokerModules = await afterCreateMessageBrokerService(context);
    const generateClientOptionsModule =
      await afterCreateMessageBrokerClientOptionsFactory(context);
    const nestjsModule = await afterCreateMessageBrokerNestJSModule(context);

    await modules.mergeMany([
      brokerModules,
      generateClientOptionsModule,
      nestjsModule,
    ]);

    expect(modules.modules()).toMatchSnapshot();
  });

  it("all modules and files should be created with custom values", async () => {
    const modules = new ModuleMap(logger);
    context.otherResources = [
      {
        buildId: "custom-mqtt-id",
        pluginInstallations: [],
        resourceType: "MessageBroker",
        resourceInfo: {
          name: "custom-mqtt",
          codeGeneratorVersionOptions: {
            codeGeneratorStrategy: undefined,
            codeGeneratorVersion: undefined,
          },
          description: "Custom MQTT broker",
          id: "custom-mqtt-id",
          settings: {
            adminUISettings: {
              adminUIPath: "/admin",
              generateAdminUI: true,
            },
            authProvider: EnumAuthProviderType.Jwt,
            serverSettings: {
              serverPath: "/server",
              generateGraphQL: true,
              generateRestApi: true,
            },
          },
          url: "mqtt://localhost:1883",
          version: "1.0.0",
        },
      },
    ];
    plugin.beforeCreateBroker(context, modules);
    const brokerModules = await afterCreateMessageBrokerService(context);
    const generateClientOptionsModule =
      await afterCreateMessageBrokerClientOptionsFactory(context);
    const nestjsModule = await afterCreateMessageBrokerNestJSModule(context);

    await modules.mergeMany([
      brokerModules,
      generateClientOptionsModule,
      nestjsModule,
    ]);

    expect(modules.modules()).toMatchSnapshot();
  });
});
