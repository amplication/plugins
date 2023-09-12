import { CreateMessageBrokerParams, DsgContext } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import RedisBrokerPlugin from "../index";


describe("Testing beforeCreateMessageBroker hook", () => {
    let plugin: RedisBrokerPlugin;
    let context: DsgContext;
    let params: CreateMessageBrokerParams;

    beforeEach(() => {
        plugin = new RedisBrokerPlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{ npm: name }],
            serverDirectories: {
                srcDirectory: "/"
            }
        });
        params = mock<CreateMessageBrokerParams>();
    });
    it("should set the message broker directory to redis", () => {
        plugin.beforeCreateMessageBroker(context, params)
        const brokerDir = context.serverDirectories.messageBrokerDirectory;
        expect(brokerDir).toStrictEqual("/redis");
    })
});
