export interface MqttMessage {
  key: string | Record<string, unknown> | null;
  value: string | Record<string, unknown> | null;
  headers: MqttMessageHeaders;
}

export interface MqttMessageHeaders {
  [key: string]: Buffer | string | number | boolean | null;
}