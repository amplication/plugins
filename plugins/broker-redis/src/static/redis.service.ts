import { Inject, Injectable } from "@nestjs/common";
import { ClientRedis } from "@nestjs/microservices";
import { REDIS_BROKER_CLIENT } from "./constants";

@Injectable()
export class RedisProducerService {
  constructor(@Inject(REDIS_BROKER_CLIENT) private redisClient: ClientRedis) {}

  async onModuleInit() {
    await this.redisClient.connect();
  }
}
