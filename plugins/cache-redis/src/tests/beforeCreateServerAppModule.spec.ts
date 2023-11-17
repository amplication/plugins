import {
  CreateServerAppModuleParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import RedisCachePlugin from "../index";
import { builders } from "ast-types";
import * as recast from "recast";
import * as utils from "../utils";

describe("Testing beforeCreateServerAppModule hook", () => {
  let plugin: RedisCachePlugin;
  let context: DsgContext;
  let params: CreateServerAppModuleParams;

  beforeEach(() => {
    plugin = new RedisCachePlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
    params = {
      ...mock<CreateServerAppModuleParams>(),
      template: utils.parse(`
            import { Module, Scope } from "@nestjs/common";

            declare const MODULES: any;
            `),
      templateMapping: {
        MODULES: builders.arrayExpression([]),
      },
    };
  });
  it("should add the necessary imports to the file", () => {
    const { template } = plugin.beforeCreateServerAppModule(context, params);
    const expectedCode = prettyCode(`
        import { Module, Scope } from "@nestjs/common";
        import { CacheModule } from "@nestjs/cache-manager";
        import { redisStore } from "cache-manager-ioredis-yet"

        declare const MODULES: any;
        `);
    const templateCode = recast.prettyPrint(template).code;
    expect(templateCode).toBe(expectedCode);
  });
  it("should add the cache module configured with Redis to the modules list", () => {
    const { templateMapping } = plugin.beforeCreateServerAppModule(
      context,
      params,
    );
    let expectedModules = prettyCode(`
        [CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
      
            useFactory: async (configService: ConfigService) => {
              const host = configService.get("REDIS_HOST");
              const port = configService.get("REDIS_PORT");
              const username = configService.get("REDIS_USERNAME");
              const password = configService.get("REDIS_PASSWORD");
              const ttl = configService.get("REDIS_TTL", 5000);
              
              return {
                store: await redisStore({
                host: host,
                port: port,
                username: username,
                password: password,
                ttl: ttl,
                }),
              };
            },
      
            inject: [ConfigService],
          })]`);
    // Remove the trailing semi-colon from the end which is inserted
    // by the prettyCode invocation
    expectedModules = utils.removeSemicolon(expectedModules);
    const modulesCode = recast.prettyPrint(templateMapping.MODULES).code;
    expect(modulesCode).toBe(expectedModules);
  });
});

const prettyCode = (code: string): string => {
  return recast.prettyPrint(utils.parse(code)).code;
};
