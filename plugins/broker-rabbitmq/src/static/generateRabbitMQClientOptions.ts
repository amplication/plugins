import { ConfigService } from "@nestjs/config";
import { RmqOptions, Transport } from "@nestjs/microservices";

export const generateRabbitMQClientOptions = (
  configService: ConfigService
): RmqOptions => {
  const RabbitMQUrlStrings = configService.get("RABBITMQ_URLS");
  const RabbitMQQueue = configService.get("RABBITMQ_QUEUE");

  if (!RabbitMQUrlStrings) {
    throw new Error("RABBITMQ_URLS environment variable must be defined");
  }

  if (!RabbitMQQueue) {
    throw new Error("RABBITMQ_QUEUE environment variable must be defined");
  }

  return {
    transport: Transport.RMQ,
    options: {
      urls: [...RabbitMQUrlStrings.split(",")],
      queue: RabbitMQQueue,
      queueOptions: {
        durable: false
      },
    },
  };
};
