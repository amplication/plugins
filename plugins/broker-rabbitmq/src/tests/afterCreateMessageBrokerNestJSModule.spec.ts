import {
  CreateMessageBrokerClientOptionsFactoryParams,
  CreateServerAuthParams,
  DsgContext,
} from "@amplication/code-gen-types";
import RabbitMQPlugin from "../index";
import { mock } from "jest-mock-extended";
import * as utils from "../util/ast";
import path from "path";

describe("Testing afterCreateMessageBrokerNestJSModule", () => {
  let plugin: RabbitMQPlugin;
  let context: DsgContext;
  let params: CreateMessageBrokerClientOptionsFactoryParams;

  beforeEach(() => {
    plugin = new RabbitMQPlugin();
    context = fakeContext();
    params = mock<CreateServerAuthParams>();
  });

  it("should correctly add the code for generating rabbitmq module", async () => {
    const modules = await plugin.afterCreateMessageBrokerNestJSModule(
      context,
      params
    );

    const rabbitMqModule = modules.get(path.join("/", "rabbitmq.module.ts"));
    const rabbitMqCode = utils.print(utils.parse(rabbitMqModule.code)).code;
    const expectedRabbitMqCode = utils.print(
      utils.parse(expectedRabbitMq)
    ).code;

    expect(rabbitMqCode).toStrictEqual(expectedRabbitMqCode);
  });
});

const expectedRabbitMq = `import { Global, Module } from "@nestjs/common";
import { ClientProxyFactory } from "@nestjs/microservices";
import { generateRabbitMQClientOptions } from "./generateRabbitMQClientOptions";
import { RabbitMQProducerService } from "./rabbitmq.producer.service";
import { RabbitMQController } from "./rabbitmq.controller";
import { ConfigService } from "@nestjs/config";

@Global()
@Module({
  imports: [],
  providers: [
    {
      provide: "RABBITMQ_CLIENT",
      useFactory: (configService: ConfigService) => {
        return ClientProxyFactory.create(
          generateRabbitMQClientOptions(configService)
        );
      },
      inject: [ConfigService],
    },
    RabbitMQProducerService,
  ],
  controllers: [RabbitMQController],
  exports: [RabbitMQProducerService],
})
export class RabbitMQModule { }
`;

const fakeContext = () => {
  return mock<DsgContext>({
    logger: {
      warn: async (
        message: string,
        params?: Record<string, unknown>,
        userFriendlyMessage?: string
      ) => {
        console.log("Warning!", userFriendlyMessage);
      },
    },
    serverDirectories: {
      messageBrokerDirectory: "/",
    },
  });
};
