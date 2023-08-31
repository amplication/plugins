import { Module } from "@nestjs/common";
import { ClientProxyFactory } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { generateRedisClientOptions } from "./generateRedisClientOptions";
import { RedisService } from "./redis.service"
import { RedisController } from "./redis.controller";
import { REDIS_BROKER_CLIENT } from "./constants";

@Module({
  imports: [],
  providers: [
    {
      provide: REDIS_BROKER_CLIENT,
      useFactory: (configService: ConfigService) => {
        return ClientProxyFactory.create(
          generateRedisClientOptions(configService)
        );
      },
      inject: [ConfigService],
    },
    RedisService
  ],
  controllers: [RedisController],
  exports: [RedisService]
})
export class RedisModule {}
