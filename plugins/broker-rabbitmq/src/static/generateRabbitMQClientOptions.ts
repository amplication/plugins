import { ConfigService } from "@nestjs/config";
import { RmqOptions, Transport } from "@nestjs/microservices";
import { MyMessageBrokerTopics } from "./topics";

export const generateRabbitMQClientOptions = (
  configService: ConfigService,
  topic?: string
): RmqOptions => {
  const RabbitMQUrlStrings = configService.get("RABBITMQ_URLS");

  if (!RabbitMQUrlStrings) {
    throw new Error("RABBITMQ_URLS environment variable must be defined");
  }
  
  return {
    transport: Transport.RMQ,
    options: {
      urls: [...RabbitMQUrlStrings.split(",")],
      queue: topic,
      queueOptions: {
        noAssert: topic ? false : true, // If topic is not defined, then the queue is not created
      },
    },
  };
};
