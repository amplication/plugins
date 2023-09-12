import { Inject, Injectable } from "@nestjs/common";
import { ClientRedis } from "@nestjs/microservices";
import { REDIS_BROKER_CLIENT } from "./constants";
import { RedisMessage } from "./redisMessage";
import { AllMessageBrokerTopics } from "./topics";

@Injectable()
export class RedisProducerService {
  constructor(@Inject(REDIS_BROKER_CLIENT) private redisClient: ClientRedis) {}

  async onModuleInit() {
    await this.redisClient.connect();
  }

  async emitMessage(
    topic: AllMessageBrokerTopics,
    message: RedisMessage
  ): Promise<void> {
    return await new Promise((resolve, reject) => {
      this.redisClient.emit(topic, message).subscribe({
        error: (err: Error) => {
          reject(err);
        },
        next: () => {
          resolve();
        },
      });
    });
  }
}
