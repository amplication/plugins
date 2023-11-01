import { RabbitMQMessageHeaders } from "./RabbitMQMessageHeaders";

export interface RabbitMQMessage {
  key: string | Record<string, any> | null;
  value: string | Record<string, any>;
  headers?: RabbitMQMessageHeaders;
}
