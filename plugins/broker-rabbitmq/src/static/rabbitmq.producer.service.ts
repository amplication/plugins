import { Inject, Injectable } from "@nestjs/common";
import { ClientRMQ } from "@nestjs/microservices";
import { RabbitMQMessage } from "./RabbitMQMessage";
import { AllMessageBrokerTopics } from "./topics";

@Injectable()
export class RabbitMQProducerService {
  constructor(@Inject("RABBITMQ_CLIENT") private rabbitMQClient: ClientRMQ) { }

  async emitMessage(
    topic: AllMessageBrokerTopics,
    message: RabbitMQMessage
  ): Promise<void> {
    return await new Promise((resolve, reject) => {
      this.rabbitMQClient.emit(topic, message).subscribe({
        error: (err: Error) => {
          reject(err);
        },
        next: () => {
          resolve();
        },
      });
    });
  }

  async onModuleInit() {
    await this.rabbitMQClient.connect();
  }
}
