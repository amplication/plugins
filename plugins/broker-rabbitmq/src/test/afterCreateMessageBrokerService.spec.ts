import { CreateMessageBrokerServiceParams, DsgContext } from "@amplication/code-gen-types";
import RabbitMQPlugin from "../index";
import { mock } from "jest-mock-extended"
import * as utils from "../util/ast"

describe("Testing afterCreateMessageBrokerService", () => {
    let plugin: RabbitMQPlugin
    let context: DsgContext
    let params: CreateMessageBrokerServiceParams

    beforeEach(() => {
        plugin = new RabbitMQPlugin();
        context = fakeContext()
        params = mock<CreateMessageBrokerServiceParams>()
    })

    it("should correctly add the code for generating rabbitmq producer service", async () => {
        const modules = await plugin.afterCreateMessageBrokerService(context, params);

        const rabbitMqProducerService = modules.get("/rabbitmq.producer.service.ts");
        const rabbitMqProducerServiceCode = utils.print(utils.parse(rabbitMqProducerService.code)).code;
        const expectedProducerServiceCode = utils.print(utils.parse(expectedProducerService)).code;

        const rabbitMQMessage = modules.get("/RabbitMQMessage.ts");
        const rabbitMQMessageCode = utils.print(utils.parse(rabbitMQMessage.code)).code;
        const expectedRabbitMQMessageCode = utils.print(utils.parse(expectedRabbitMQMessage)).code;

        const rabbitMQMessageHeaders = modules.get("/RabbitMQMessageHeaders.ts");
        const rabbitMQMessageHeadersCode = utils.print(utils.parse(rabbitMQMessageHeaders.code)).code;
        const expectedRabbitMQMessageHeadersCode = utils.print(utils.parse(expectedRabbitMQMessageHeaders)).code;

        expect(rabbitMqProducerServiceCode).toStrictEqual(expectedProducerServiceCode);
        expect(rabbitMQMessageCode).toStrictEqual(expectedRabbitMQMessageCode);
        expect(rabbitMQMessageHeadersCode).toStrictEqual(expectedRabbitMQMessageHeadersCode);
    })
})

const expectedRabbitMQMessage = `import { RabbitMQMessageHeaders } from "./RabbitMQMessageHeaders";

export interface RabbitMQMessage {
  key: string | Record<string, any> | null;
  value: string | Record<string, any>;
  headers?: RabbitMQMessageHeaders;
}
`
const expectedRabbitMQMessageHeaders = `export interface RabbitMQMessageHeaders {
  [key: string]: Buffer | string | undefined;
}`

const expectedProducerService = `import { Inject, Injectable } from "@nestjs/common";
import { ClientRMQ } from "@nestjs/microservices";
import { RabbitMQMessage } from "./RabbitMQMessage";
import { MyMessageBrokerTopics } from "./topics";

@Injectable()
export class RabbitMQProducerService {
  constructor(@Inject("RABBITMQ_CLIENT") private rabbitMQClient: ClientRMQ) { }

  async emitMessage(
    topic: MyMessageBrokerTopics,
    message: RabbitMQMessage
  ): Promise<void> {
    return await new Promise((resolve, reject) => {
      this.rabbitMQClient.emit(topic, message).subscribe({
        error: (err: Error) => {
          reject(err);
        },
        next: () => {
          resolve();
        },
      });
    });
  }

  async onModuleInit() {
    await this.rabbitMQClient.connect();
  }
}
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
