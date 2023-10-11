import { CreateMessageBrokerNestJSModuleParams, DsgContext } from "@amplication/code-gen-types";
import RabbitMQPlugin from "../index";
import { mock } from "jest-mock-extended"
import * as utils from "../util/ast"

describe("Testing afterCreateMessageBrokerClientOptionsFactory", () => {
    let plugin: RabbitMQPlugin
    let context: DsgContext
    let params: CreateMessageBrokerNestJSModuleParams

    beforeEach(() => {
        plugin = new RabbitMQPlugin();
        context = fakeContext()
        params = mock<CreateMessageBrokerNestJSModuleParams>()
    })

    it("should correctly add the code for generating rabbitmq Client Options", async () => {
        const modules = await plugin.afterCreateMessageBrokerClientOptionsFactory(context, params);

        const rabbitMqClientOptionsModule = modules.get("/generateRabbitMQClientOptions.ts");
        const rabbitMqClientOptionsCode = utils.print(utils.parse(rabbitMqClientOptionsModule.code)).code;
        const expectedRabbitMqClientOptionsCode = utils.print(utils.parse(expectedRabbitMqClientOptions)).code;

        const testModule = modules.get("/generateRabbitMQClientOptions.spec.ts");
        const testCode = utils.print(utils.parse(testModule.code)).code;
        const expectedTestCode = utils.print(utils.parse(expectedTest)).code;

        expect(rabbitMqClientOptionsCode).toStrictEqual(expectedRabbitMqClientOptionsCode);
        expect(testCode).toStrictEqual(expectedTestCode);
    })
})


const expectedTest = `import { ConfigService } from "@nestjs/config"
import { generateRabbitMQClientOptions } from "./generateRabbitMQClientOptions"
import { mock } from "jest-mock-extended"

describe("Testing the RabbitMQ Plugin", () => {
    let ConfigService: ConfigService

    describe("Testing the Generate RabbitMQ Client Options", () => {
        beforeEach(() => {
            ConfigService = mock<ConfigService>()
        })
        it("should work since we return a mock value", () => {
            let configGet = (ConfigService.get as jest.Mock)
            configGet.mockReset()
            configGet.mockReturnValue("Test")
            generateRabbitMQClientOptions(ConfigService);
            expect(configGet.mock.calls.length).toBe(2)
            expect(configGet.mock.calls[0][0]).toBe("RABBITMQ_URLS")
            expect(configGet.mock.calls[1][0]).toBe("RABBITMQ_QUEUE")
        })

        it("should throw an error", () => {
            let configGet = (ConfigService.get as jest.Mock)
            configGet.mockReset()
            
            expect(() => generateRabbitMQClientOptions(ConfigService))
                .toThrowError("RABBITMQ_URLS environment variable must be defined")
            expect(configGet.mock.calls.length).toBe(2)
            expect(configGet.mock.calls[0][0]).toBe("RABBITMQ_URLS")
            expect(configGet.mock.calls[1][0]).toBe("RABBITMQ_QUEUE")
        })
    })
})`
const expectedRabbitMqClientOptions = `import { ConfigService } from "@nestjs/config";
import { RmqOptions, Transport } from "@nestjs/microservices";

export const generateRabbitMQClientOptions = (
  configService: ConfigService
): RmqOptions => {
  const RabbitMQUrlStrings = configService.get("RABBITMQ_URLS");
  const RabbitMQQueue = configService.get("RABBITMQ_QUEUE");

  if (!RabbitMQUrlStrings) {
    throw new Error("RABBITMQ_URLS environment variable must be defined");
  }

  if (!RabbitMQQueue) {
    throw new Error("RABBITMQ_QUEUE environment variable must be defined");
  }

  return {
    transport: Transport.RMQ,
    options: {
      urls: [...RabbitMQUrlStrings.split(",")],
      queue: RabbitMQQueue,
      queueOptions: {
        durable: false
      },
    },
  };
};
`

const fakeContext = () => {
    return mock<DsgContext>({
        logger: {
            warn: async (message: string, params?: Record<string, unknown>, userFriendlyMessage?: string) => {
                console.log("Warning!", userFriendlyMessage);
            }
        },
        serverDirectories: {
            messageBrokerDirectory: "/"
        }
    });
}
