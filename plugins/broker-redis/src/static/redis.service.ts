import { Inject, Injectable } from "@nestjs/common";
import { ClientRedis } from "@nestjs/microservices";

@Injectable()
export class RedisService {
  constructor(@Inject("REDIS_BROKER_CLIENT") private redisClient: ClientRedis) {}

  async onModuleInit() {
    await this.redisClient.connect();
  }
}