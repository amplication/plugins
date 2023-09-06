import { CreateMessageBrokerServiceParams, DsgContext } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import * as utils from "../utils"
import RedisBrokerPlugin from "../index";


describe("Testing afterCreateMessageBrokerService hook", () => {
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
        const serviceModule = modules.get("/redis.service.ts");
        const serviceCode = utils.print(utils.parse(serviceModule.code)).code;
        const expectedServiceCode = utils.print(utils.parse(expectedService)).code;
        const controllerModule = modules.get("/redis.controller.ts");
        const controllerCode = utils.print(utils.parse(controllerModule.code)).code;
        const expectedControllerCode = utils.print(utils.parse(expectedController)).code;
        const constsModule = modules.get("/constants.ts");
        const constsCode = utils.print(utils.parse(constsModule.code)).code;
        const expectedConstsCode = utils.print(utils.parse(expectedConsts)).code;
        expect(serviceCode).toStrictEqual(expectedServiceCode);
        expect(controllerCode).toStrictEqual(expectedControllerCode);
        expect(constsCode).toStrictEqual(expectedConstsCode);
    })
});

const expectedService = `import { Inject, Injectable } from "@nestjs/common";
import { ClientRedis } from "@nestjs/microservices";
import { REDIS_BROKER_CLIENT } from "./constants";

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_BROKER_CLIENT) private redisClient: ClientRedis) {}

  async onModuleInit() {
    await this.redisClient.connect();
  }
}
`

const expectedController = `import { Controller } from "@nestjs/common";

@Controller()
export class RedisController {}
`

const expectedConsts = `export const REDIS_BROKER_CLIENT = "REDIS_BROKER_CLIENT";
export const REDIS_BROKER_ENABLE_TLS = "REDIS_BROKER_ENABLE_TLS";
export const REDIS_BROKER_HOST = "REDIS_BROKER_HOST";
export const REDIS_BROKER_PORT = "REDIS_BROKER_PORT";
export const REDIS_BROKER_RETRY_DELAY = "REDIS_BROKER_RETRY_DELAY";
export const REDIS_BROKER_RETRY_ATTEMPTS = "REDIS_BROKER_RETRY_ATTEMPTS";
`
