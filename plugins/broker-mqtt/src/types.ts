export interface Settings {
  mqttPort: number;
  mqttWsPort: number;
  mqttWebUiPort: number;
  mqttBrokerHost: string;
  mqttClientId: string;
  mqttPassword: string;
  mqttUsername: string;
  mqttBroker: "hivemq" | "hivemq-enterprise" | "mosquitto" | "emqx"; // @TODO: add more brokers
}
