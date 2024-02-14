import { ConfigService } from "@nestjs/config";
import { Transport, MqttOptions } from "@nestjs/microservices";

export const generateClientOptions = (
  configService: ConfigService
): MqttOptions => {
  const mqttBrokerHost = configService.get<string>("MQTT_BROKER_HOST");
  const mqttBrokerPort = configService.get<number>("MQTT_PORT");
  const clientId = configService.get<string>("MQTT_CLIENT_ID");
  const username = configService.get<string>("MQTT_USERNAME");
  const password = configService.get<string>("MQTT_PASSWORD");
  
  if (!mqttBrokerHost || !mqttBrokerPort || !clientId || !username || !password) {
    throw new Error(
      "MQTT_BROKER_HOST, MQTT_PORT, MQTT_CLIENT_ID, MQTT_USERNAME, MQTT_PASSWORD must be defined"
    );
  }

  return {
    transport: Transport.MQTT,
    options: {
      host: mqttBrokerHost,
      port: mqttBrokerPort,
      clientId: clientId,
      username,
      password,
      connectTimeout: 10000,
    },
  };
}