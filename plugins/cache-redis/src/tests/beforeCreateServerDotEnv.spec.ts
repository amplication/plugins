import { CreateServerDotEnvParams, DsgContext, VariableDictionary } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import RedisCachePlugin from "../index";
import * as utils from "../utils"
import { settings as defaultSettings } from "../../.amplicationrc.json"


describe("Testing beforeCreateServerDotEnv hook", () => {
    let plugin: RedisCachePlugin;
    let context: DsgContext;
    let params: CreateServerDotEnvParams;

    beforeEach(() => {
        plugin = new RedisCachePlugin();
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
        const userSpecifiedSettings = {
            host: "192.168.10.1",
            port: 7000,
            ttl: 10000,
            max: 1000000,
            username: "name",
            password: "password"
        }
        context.pluginInstallations[0].settings = userSpecifiedSettings;
        const { envVariables } = plugin.beforeCreateServerDotEnv(context, params);
        expect(envVariables).toStrictEqual(utils.settingsToVarDict(userSpecifiedSettings));
    });
});

