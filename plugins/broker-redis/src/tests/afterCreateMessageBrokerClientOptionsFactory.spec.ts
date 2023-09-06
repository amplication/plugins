import { CreateMessageBrokerClientOptionsFactoryParams, DsgContext } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import * as utils from "../utils";
import RedisBrokerPlugin from "../index";


describe("Testing afterCreateMessageBrokerClientOptionsFactory hook", () => {
    let plugin: RedisBrokerPlugin;
    let context: DsgContext;
    let params: CreateMessageBrokerClientOptionsFactoryParams;

    beforeEach(() => {
        plugin = new RedisBrokerPlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{ npm: name }],
            serverDirectories: {
                messageBrokerDirectory: "/"
            }
        });
        params = mock<CreateMessageBrokerClientOptionsFactoryParams>();
    });
    it("should correctly add the code for generating message broker client options", async () => {
        const modules = await plugin.afterCreateMessageBrokerClientOptionsFactory(context, params)
        const path = "/generateRedisClientOptions.ts";
        const code = utils.print(utils.parse(modules.get(path).code)).code;
        const expected = utils.print(utils.parse(expectedCode)).code;
        expect(code).toStrictEqual(expected);
    })
});

const expectedCode = `import { ConfigService } from "@nestjs/config";
import { REDIS_BROKER_ENABLE_TLS, REDIS_BROKER_URL, REDIS_BROKER_RETRY_ATTEMPTS, REDIS_BROKER_RETRY_DELAY } from "./constants";
import { RedisOptions, Transport } from "@nestjs/microservices";

export const generateRedisClientOptions = (
    configService: ConfigService
): RedisOptions => {
  const redisEnableTLS = configService.get(REDIS_BROKER_ENABLE_TLS) === "true";
  const redisUrl = configService.get(REDIS_BROKER_URL);
  const redisRetryAttempts = configService.get(REDIS_BROKER_RETRY_ATTEMPTS);
  const redisRetryDelay = configService.get(REDIS_BROKER_RETRY_DELAY);

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
`
