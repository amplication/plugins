import {
  CreateServerDotEnvParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { convertToVarDict, getPluginSettings } from "../utils";

export const beforeCreateServerDotEnv = (
  context: DsgContext,
  eventParams: CreateServerDotEnvParams,
): CreateServerDotEnvParams => {
  const settings = getPluginSettings(context.pluginInstallations);
  const { resourceInfo } = context;
  const {
    mqttPort,
    mqttPassword,
    mqttUsername,
    mqttClientId,
    mqttBrokerHost,
    mqttWsPort,
    mqttWebUiPort,
    sparkplugConfig,
  } = settings;
  const { envVariables } = eventParams;

  const clientId = mqttClientId || `broker-mqtt-${resourceInfo?.id}`;

  eventParams.envVariables = envVariables.concat(
    convertToVarDict({
      MQTT_BROKER_HOST: mqttBrokerHost || "localhost",
      MQTT_WEB_UI_PORT: mqttWebUiPort?.toString() || "8080",
      MQTT_PORT: mqttPort?.toString() || "1883",
      MQTT_WS_PORT: mqttWsPort?.toString() || "8073",
      MQTT_USERNAME: mqttUsername,
      MQTT_PASSWORD: mqttPassword,
      MQTT_CLIENT_ID: mqttClientId || clientId,
    }),
  );

  if (sparkplugConfig.enabled) {
    const { groupIdentifier, edgeNodeIdentifier, clientIdentifier } =
      sparkplugConfig;
    eventParams.envVariables = eventParams.envVariables.concat(
      convertToVarDict({
        MQTT_SPARKPLUG_GROUP_ID: groupIdentifier,
        MQTT_SPARKPLUG_EDGE_NODE: edgeNodeIdentifier,
        MQTT_SPARKPLUG_CLIENT_ID:
          clientIdentifier ||
          `amplication-sparkplug-client-${resourceInfo?.id}`,
      }),
    );
  }

  return eventParams;
};
