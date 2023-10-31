import {
  CreateMessageBrokerServiceParams,
  DsgContext,
  EnumMessagePatternConnectionOptions,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import * as utils from "../utils";
import RedisBrokerPlugin from "../index";

describe("Testing afterCreateMessageBrokerService hook", () => {
  let plugin: RedisBrokerPlugin;
  let context: DsgContext;
  let params: CreateMessageBrokerServiceParams;

  beforeEach(() => {
    plugin = new RedisBrokerPlugin();
    context = fakeContext();
    params = mock<CreateMessageBrokerServiceParams>();
  });
  it("should correctly add the code for generating message broker module", async () => {
    const modules = await plugin.afterCreateMessageBrokerService(
      context,
      params
    );
    const serviceModule = modules.get("/redis.producer.service.ts");
    const serviceCode = utils.print(utils.parse(serviceModule.code)).code;
    const expectedServiceCode = utils.print(utils.parse(expectedService)).code;
    const controllerModule = modules.get("/redis.controller.ts");
    const controllerCode = utils.print(utils.parse(controllerModule.code)).code;
    const expectedControllerCode = utils.print(
      utils.parse(expectedController)
    ).code;
    const constsModule = modules.get("/constants.ts");
    const constsCode = utils.print(utils.parse(constsModule.code)).code;
    const expectedConstsCode = utils.print(utils.parse(expectedConsts)).code;
    const redisMessageModule = modules.get("/redisMessage.ts");
    const redisMessageCode = utils.print(
      utils.parse(redisMessageModule.code)
    ).code;
    expect(serviceCode).toStrictEqual(expectedServiceCode);
    expect(controllerCode).toStrictEqual(expectedControllerCode);
    expect(constsCode).toStrictEqual(expectedConstsCode);
    expect(redisMessageCode).toStrictEqual(expectedRedisMessageCode);
  });
});

const expectedService = `import { Inject, Injectable } from "@nestjs/common";
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
`;

const expectedController = `import { EventPattern, Payload } from "@nestjs/microservices";
import { Controller } from "@nestjs/common";
import { RedisMessage } from "./redisMessage";

@Controller("redis-controller")
export class RedisController {
  @EventPattern("theFirstTopicInTheFirstBroker")
  async onTheFirstTopicInTheFirstBroker(
    @Payload()
    message: RedisMessage
  ): Promise<void> {}

  @EventPattern("theSecondTopicInTheFirstBroker")
  async onTheSecondTopicInTheFirstBroker(
    @Payload()
    message: RedisMessage
  ): Promise<void> {}

  @EventPattern("theFirstTopicInTheSecondBroker")
  async onTheFirstTopicInTheSecondBroker(
    @Payload()
    message: RedisMessage
  ): Promise<void> {}
}
`;

const expectedConsts = `export const REDIS_BROKER_CLIENT = "REDIS_BROKER_CLIENT";
export const REDIS_BROKER_ENABLE_TLS = "REDIS_BROKER_ENABLE_TLS";
export const REDIS_BROKER_HOST = "REDIS_BROKER_HOST";
export const REDIS_BROKER_PORT = "REDIS_BROKER_PORT";
export const REDIS_BROKER_RETRY_DELAY = "REDIS_BROKER_RETRY_DELAY";
export const REDIS_BROKER_RETRY_ATTEMPTS = "REDIS_BROKER_RETRY_ATTEMPTS";
`;

const expectedRedisMessageCode = `export type RedisMessage = any;
`;

const fakeContext = () => {
  return mock<DsgContext>({
    pluginInstallations: [{ npm: name }],
    serverDirectories: {
      messageBrokerDirectory: "/",
    },
    serviceTopics: [
      {
        id: "first-broker-first-service-topic",
        enabled: true,
        messageBrokerId: "first-broker-id",
        patterns: [
          {
            topicId: "first-service-topic-first-topic",
            topicName: "theFirstTopicInTheFirstBroker",
            type: EnumMessagePatternConnectionOptions.Receive,
          },
          {
            topicId: "first-service-topic-second-topic",
            topicName: "theSecondTopicInTheFirstBroker",
            type: EnumMessagePatternConnectionOptions.Receive,
          },
        ],
      },
      {
        id: "second-broker-first-service-topic",
        enabled: true,
        messageBrokerId: "second-broker-id",
        patterns: [
          {
            topicId: "second-service-topic-first-topic",
            topicName: "theFirstTopicInTheSecondBroker",
            type: EnumMessagePatternConnectionOptions.Receive,
          },
        ],
      },
    ],
    otherResources: [
      {
        resourceType: "MessageBroker",
        buildId: "abuildid",
        pluginInstallations: [],
        roles: [],
        entities: [],
        topics: [
          {
            resourceId: "first-broker-first-topic",
            id: "first-service-topic-first-topic",
            name: "theFirstTopicInTheFirstBroker",
          },
          {
            resourceId: "first-broker-second-topic",
            id: "first-service-topic-second-topic",
            name: "theSecondTopicInTheFirstBroker",
          },
        ],
        resourceInfo: {
          name: "firstMessageBroker",
          description: "This resource is used to store project configuration.",
          version: "1.0",
          id: "first-broker-id",
          url: "http://localhost:3000/first-broker-id",
        },
      },
      {
        resourceType: "MessageBroker",
        buildId: "abuildid",
        pluginInstallations: [],
        roles: [],
        entities: [],
        topics: [
          {
            resourceId: "second-broker-first-topic",
            id: "second-service-topic-first-topic",
            name: "theFirstTopicInTheSecondBroker",
          },
        ],
        resourceInfo: {
          name: "secondMessageBroker",
          description: "This resource is used to store project configuration.",
          version: "1.0",
          id: "second-broker-id",
          url: "http://localhost:3000/second-broker-id",
        },
      },
    ],
  });
};
