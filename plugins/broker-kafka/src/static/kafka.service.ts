import { Inject } from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";

export class KafkaService {
  constructor(@Inject("KAFKA_CLIENT") private kafkaClient: ClientKafka) {}

  async emitMessage(topic: string, message: string): Promise<void> {
    return await new Promise((resolve, reject) => {
      this.kafkaClient.emit(topic, message).subscribe({
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
    await this.kafkaClient.connect();
  }
}
