export type MqttMessage = string | Record<string, unknown> | null;  

export interface MqttMessageHeaders {
  [key: string]: Buffer | string | number | boolean | null;
}