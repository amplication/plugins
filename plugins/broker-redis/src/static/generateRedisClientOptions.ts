import { ConfigService } from "@nestjs/config";
import { RedisOptions, Transport } from "@nestjs/microservices";

export const generateRedisClientOptions = (
    configService: ConfigService
): RedisOptions => {
  const redisEnableTLS = configService.get("REDIS_BROKER_ENABLE_TLS") === "true";
  const redisUrl = configService.get("REDIS_BROKER_URL");
  const redisRetryAttempts = configService.get("REDIS_BROKER_RETRY_ATTEMPTS");
  const redisRetryDelay = configService.get("REDIS_BROKER_RETRY_DELAY");

  if (!redisUrl) {
    throw new Error("REDIS_BROKER_URL environment variable must be defined");
  }

  if (!redisRetryDelay) {
    throw new Error("REDIS_BROKER_RETRY_DELAY environment variable must be defined");
  }

  if (!redisRetryAttempts) {
    throw new Error("REDIS_BROKER_RETRY_ATTEMPTS environment variable must be defined");
  }

  return {
    transport: Transport.REDIS,
    options: {
      url: redisUrl,
      retryAttempts: redisRetryAttempts,
      retryDelay: redisRetryDelay,
      tls: redisEnableTLS
    },
  };
};
