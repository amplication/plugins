import { CreateMessageBrokerNestJSModuleParams, DsgContext } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import * as utils from "../utils"
import RedisBrokerPlugin from "../index";


describe("Testing afterCreateMessageBrokerNestJSModule hook", () => {
    let plugin: RedisBrokerPlugin;
    let context: DsgContext;
    let params: CreateMessageBrokerNestJSModuleParams;

    beforeEach(() => {
        plugin = new RedisBrokerPlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{ npm: name }],
            serverDirectories: {
                messageBrokerDirectory: "/"
            }
        });
        params = mock<CreateMessageBrokerNestJSModuleParams>();
    });
    it("should correctly add the code for generating message broker module", async () => {
        const modules = await plugin.afterCreateMessageBrokerNestJSModule(context, params);
        const module = modules.get("/redis.module.ts");
        const code = utils.print(utils.parse(module.code)).code;
        const expected = utils.print(utils.parse(expectedCode)).code;
        expect(code).toStrictEqual(expected);
    })
});

const expectedCode = `import { Module } from "@nestjs/common";
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
export class RedisModule {}`