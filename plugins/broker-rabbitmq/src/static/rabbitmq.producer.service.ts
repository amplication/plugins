import { Inject, Injectable } from "@nestjs/common";
import { ClientRMQ, RmqRecordBuilder } from "@nestjs/microservices";
import { RabbitMQMessage } from "./RabbitMQMessage";
import { RabbitMQMessageHeaders } from "./RabbitMQMessageHeaders";
import { AllMessageBrokerTopics } from "./topics";

@Injectable()
export class RabbitMQProducerService {
  constructor(@Inject("RABBITMQ_CLIENT") private rabbitMQClient: ClientRMQ) { }

  async emitMessage(
    topic: AllMessageBrokerTopics,
    message: RabbitMQMessage,
    headers?: RabbitMQMessageHeaders,
    priority?: number
  ): Promise<void> {
    const record = new RmqRecordBuilder(message)
    .setOptions({
      headers,
      priority,
    })
    .build();
      
    const client = await this.rabbitMQClient.createClient();
    const channel = client.createChannel();

    await channel.waitForConnect();

    await channel.assertExchange(topic, "fanout", { durable: true });
    await channel.publish(topic, "", Buffer.from(JSON.stringify({ pattern : topic, data:record})), {
      persistent: true,
    });
  }

  async onModuleInit() {
    await this.rabbitMQClient.connect();
  }
}
