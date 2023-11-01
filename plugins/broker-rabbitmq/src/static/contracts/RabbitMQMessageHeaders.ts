export interface RabbitMQMessageHeaders {
  [key: string]: Buffer | string | undefined;
}