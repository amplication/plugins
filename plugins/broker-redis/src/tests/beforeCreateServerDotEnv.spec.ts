import { CreateServerDotEnvParams, DsgContext, VariableDictionary } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import RedisBrokerPlugin from "../index";
import * as utils from "../utils"
import { Settings } from "../types";
import { settings as defaultSettings } from "../../.amplicationrc.json"


describe("Testing beforeCreateServerDotEnv hook", () => {
    let plugin: RedisBrokerPlugin;
    let context: DsgContext;
    let params: CreateServerDotEnvParams;

    beforeEach(() => {
        plugin = new RedisBrokerPlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{ npm: name }]
        });
        params = { envVariables: [] }
    });
    it("should use the default settings when no user settings are specified", () => {
        context.pluginInstallations[0].settings = {}
        const { envVariables } = plugin.beforeCreateServerDotEnv(context, params);
        const expectedEnvVars: VariableDictionary = utils.settingsToVarDict(defaultSettings)
        expect(envVariables).toStrictEqual(expectedEnvVars)
    });
    it("should use the user specified settings when the user specifies them", () => {
        const userSpecifiedSettings: Settings = {
            host: "192.168.0.1",
            port: 9000,
            retryAttempts: 45,
            retryDelay: 50,
            enableTls: true
        }
        context.pluginInstallations[0].settings = userSpecifiedSettings;
        const { envVariables } = plugin.beforeCreateServerDotEnv(context, params);
        expect(envVariables).toStrictEqual([
            { REDIS_BROKER_HOST: "192.168.0.1" },
            { REDIS_BROKER_PORT: "9000" },
            { REDIS_BROKER_RETRY_ATTEMPTS: "45" },
            { REDIS_BROKER_RETRY_DELAY: "50" },
            { REDIS_BROKER_ENABLE_TLS: "true" }
        ]);
    });
});

