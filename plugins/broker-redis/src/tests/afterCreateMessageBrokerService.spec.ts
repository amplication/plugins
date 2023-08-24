import { CreateMessageBrokerNestJSModuleParams, CreateMessageBrokerServiceBaseParams, CreateMessageBrokerServiceParams, DsgContext } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import * as utils from "@amplication/code-gen-utils"
import RedisBrokerPlugin from "../index";


describe("Testing afterCreateMessageBrokerClientOptionsFactory hook", () => {
    let plugin: RedisBrokerPlugin;
    let context: DsgContext;
    let params: CreateMessageBrokerServiceParams;

    beforeEach(() => {
        plugin = new RedisBrokerPlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{ npm: name }],
            serverDirectories: {
                messageBrokerDirectory: "/"
            }
        });
        params = mock<CreateMessageBrokerServiceParams>();
    });
    it("should correctly add the code for generating message broker module", async () => {
        const modules = await plugin.afterCreateMessageBrokerService(context, params);
        const module = modules.get("/redis.service.ts");
        const code = utils.print(utils.parse(module.code)).code;
        const expected = utils.print(utils.parse(expectedCode)).code;
        expect(code).toStrictEqual(expected);
    })
});

const expectedCode = `import { Inject, Injectable } from "@nestjs/common";
import { ClientRedis } from "@nestjs/microservices";

@Injectable()
export class RedisService {
  constructor(@Inject("REDIS_BROKER_CLIENT") private redisClient: ClientRedis) {}

  async onModuleInit() {
    await this.redisClient.connect();
  }
}`