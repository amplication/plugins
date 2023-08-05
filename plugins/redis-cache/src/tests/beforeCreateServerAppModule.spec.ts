import { CreateServerAppModuleParams, DsgContext } from "@amplication/code-gen-types";
import { deepEqual } from "assert";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import RedisCachePlugin from "../index";
import { builders } from "ast-types"
import * as recast from "recast"
import * as utils from "../utils"


describe("Testing beforeCreateServerAppModule hook", () => {
    let plugin: RedisCachePlugin;
    let context: DsgContext;
    let params: CreateServerAppModuleParams;

    beforeEach(() => {
        plugin = new RedisCachePlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{ npm: name }]
        });
        params = {
            ...mock<CreateServerAppModuleParams>(),
            template: utils.parse(`
            import { Module, Scope } from "@nestjs/common";
            import { APP_INTERCEPTOR } from "@nestjs/core";
            import { MorganInterceptor } from "nest-morgan";

            declare const MODULES: any;
            `),
            templateMapping: {
                MODULES: builders.arrayExpression([])
            }
        }
    });
    it("should add the necessary imports to the file", () => {
        const { template } = plugin.beforeCreateServerAppModule(context, params)
        const expectedCode = prettyCode(`
        import { Module, Scope } from "@nestjs/common";
        import { APP_INTERCEPTOR } from "@nestjs/core";
        import { MorganInterceptor } from "nest-morgan";
        import { CacheModule } from "@nestjs/common";
        import * as redisStore from "cache-manager-redis-store"

        declare const MODULES: any;
        `)
        const templateCode = recast.prettyPrint(template).code
        expect(templateCode).toBe(expectedCode)

    })
    it("should add the cache module configured with Redis to the modules list", () => {
        const { templateMapping } = plugin.beforeCreateServerAppModule(context, params)
        let expectedModules = prettyCode(`
        [CacheModule.register({
            isGlobal: true
        })]`);
        // Remove the trailing semi-colon
        expectedModules = expectedModules.slice(0, -1)
        const modulesCode = recast.prettyPrint(templateMapping.MODULES).code;
        expect(modulesCode).toBe(expectedModules);
    });
});

const prettyCode = (code: string): string => {
    return recast.prettyPrint(utils.parse(code)).code
}