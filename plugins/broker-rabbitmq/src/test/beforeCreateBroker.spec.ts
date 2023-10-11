import { CreateMessageBrokerParams, DsgContext } from "@amplication/code-gen-types";
import RabbitMQPlugin from "../index";
import { mock } from "jest-mock-extended"

describe("Testing beforeCreateBroker", () => {
    let plugin: RabbitMQPlugin
    let context: DsgContext
    let params: CreateMessageBrokerParams
    let expectedMessageBrokerDirectory: string

    beforeEach(async () => {
        plugin = new RabbitMQPlugin();
        context = fakeContext()
        params = mock<CreateMessageBrokerParams>()
        expectedMessageBrokerDirectory = "/rabbitmq"
    })

    it("should correctly change the messageBrokerDirectory", async () => {
        plugin.beforeCreateBroker(context, params);
        expect(context.serverDirectories.messageBrokerDirectory).toStrictEqual(expectedMessageBrokerDirectory);
    })
})

const fakeContext = () => {
    return mock<DsgContext>({
        logger: {
            warn: async (message: string, params?: Record<string, unknown>, userFriendlyMessage?: string) => {
                console.log("Warning!", userFriendlyMessage);
            }
        },
        serverDirectories: {
            messageBrokerDirectory: "/",
            srcDirectory: "/"
        }
    });
}
