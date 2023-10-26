import { ConfigService } from "@nestjs/config";
import {
  REDIS_BROKER_ENABLE_TLS,
  REDIS_BROKER_HOST,
  REDIS_BROKER_PORT,
  REDIS_BROKER_RETRY_ATTEMPTS,
  REDIS_BROKER_RETRY_DELAY,
} from "./constants";
import { RedisOptions, Transport } from "@nestjs/microservices";

export const generateRedisClientOptions = (
  configService: ConfigService
): RedisOptions => {
  const redisEnableTLS = configService.get(REDIS_BROKER_ENABLE_TLS) === "true";
  const redisHost = configService.get(REDIS_BROKER_HOST);
  const redisPort = configService.get(REDIS_BROKER_PORT);
  const redisRetryAttempts = configService.get(REDIS_BROKER_RETRY_ATTEMPTS);
  const redisRetryDelay = configService.get(REDIS_BROKER_RETRY_DELAY);
  const redisUrl = `redis://${redisHost}:${redisPort}`;

  if (!redisHost) {
    throw new Error("REDIS_BROKER_HOST environment variable must be defined");
  }

  if (!redisPort) {
    throw new Error("REDIS_BROKER_PORT environment variable must be defined");
  }

  if (!redisRetryDelay) {
    throw new Error(
      "REDIS_BROKER_RETRY_DELAY environment variable must be defined"
    );
  }

  if (!redisRetryAttempts) {
    throw new Error(
      "REDIS_BROKER_RETRY_ATTEMPTS environment variable must be defined"
    );
  }

  return {
    transport: Transport.REDIS,
    options: {
      url: redisUrl,
      retryAttempts: redisRetryAttempts,
      retryDelay: redisRetryDelay,
      tls: redisEnableTLS,
    },
  };
};
