import {
  AppInfo,
  CreateServerDotEnvParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { beforeCreateServerDotEnv } from "../events/createServerDotEnv";
import { mock } from "jest-mock-extended";

describe("Testing beforeCreateServerDotEnv hook", () => {
  let context: DsgContext;
  let eventParams: CreateServerDotEnvParams;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [
        {
          npm: "@amplication/plugin-broker-mqtt",
        },
      ],
    });
    eventParams = mock<CreateServerDotEnvParams>({
      envVariables: [],
    });
  });

  it("should use default values if plugin settings are not defined", () => {
    eventParams = beforeCreateServerDotEnv(context, eventParams);

    const expectedEnvVariables = [
      { MQTT_BROKER_HOST: "localhost" },
      { MQTT_WEB_UI_PORT: "8080" },
      { MQTT_PORT: "1883" },
      { MQTT_WS_PORT: "8073" },
      { MQTT_USERNAME: "admin" },
      { MQTT_PASSWORD: "admin" },
      { MQTT_CLIENT_ID: "broker-mqtt-undefined" },
    ];

    expect(eventParams.envVariables).toEqual(expectedEnvVariables);
  });

  it("should use plugin settings if defined", () => {
    context.pluginInstallations[0].settings = {
      mqttBrokerHost: "CUSTOM_MQTT_BROKER_HOST",
      mqttWebUiPort: 1234,
      mqttPort: 5678,
      mqttWsPort: 9012,
      mqttUsername: "CUSTOM_MQTT_USERNAME",
      mqttPassword: "CUSTOM_MQTT_PASSWORD",
    };

    if (context.resourceInfo) {
      context.resourceInfo.id = "123";
    }

    eventParams = beforeCreateServerDotEnv(context, eventParams);

    const expectedEnvVariables = [
      { MQTT_BROKER_HOST: "CUSTOM_MQTT_BROKER_HOST" },
      { MQTT_WEB_UI_PORT: "1234" },
      { MQTT_PORT: "5678" },
      { MQTT_WS_PORT: "9012" },
      { MQTT_USERNAME: "CUSTOM_MQTT_USERNAME" },
      { MQTT_PASSWORD: "CUSTOM_MQTT_PASSWORD" },
      { MQTT_CLIENT_ID: "broker-mqtt-123" },
    ];

    expect(eventParams.envVariables).toEqual(expectedEnvVariables);
  });

  it("should work with sparkplug", () => {
    context.pluginInstallations[0].settings = {
      sparkplugConfig: {
        enabled: true,
        groupIdentifier: "group",
        edgeNodeIdentifier: "edge",
      },
    };

    context.resourceInfo = mock<AppInfo>({
      id: "123",
    });

    eventParams = beforeCreateServerDotEnv(context, eventParams);

    const expectedEnvVariables = [
      { MQTT_BROKER_HOST: "localhost" },
      { MQTT_WEB_UI_PORT: "8080" },
      { MQTT_PORT: "1883" },
      { MQTT_WS_PORT: "8073" },
      { MQTT_USERNAME: "admin" },
      { MQTT_PASSWORD: "admin" },
      { MQTT_CLIENT_ID: "broker-mqtt-123" },
      { MQTT_SPARKPLUG_GROUP_ID: "group" },
      { MQTT_SPARKPLUG_EDGE_NODE: "edge" },
      { MQTT_SPARKPLUG_CLIENT_ID: "amplication-sparkplug-client-123" },
    ];

    expect(eventParams.envVariables).toEqual(expectedEnvVariables);
  });
});
