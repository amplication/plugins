import {
  CreateServerDotEnvParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { getPluginSettings } from "../utils";

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
  } = settings;
  const { envVariables } = eventParams;

  const clientId = mqttClientId || `broker-mqtt-${resourceInfo?.id}`;

  envVariables.push({
    MQTT_BROKER_HOST: mqttBrokerHost || "localhost",
    MQTT_WEB_UI_PORT: mqttWebUiPort?.toString() || "8080",
    MQTT_PORT: mqttPort?.toString() || "1883",
    MQTT_WS_PORT: mqttWsPort?.toString() || "8073",
    MQTT_USERNAME: mqttUsername,
    MQTT_PASSWORD: mqttPassword,
    MQTT_CLIENT_ID: mqttClientId || clientId,
  });

  return eventParams;
};
