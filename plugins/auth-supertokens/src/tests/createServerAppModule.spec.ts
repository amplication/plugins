import {
  BuildLogger,
  CreateServerAppModuleParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { parse } from "@amplication/code-gen-utils";
import { builders } from "ast-types";
import * as recast from "recast";
import { prettyCode } from "../utils";
import SupertokensAuthPlugin from "../index";
import { name } from "../../package.json";

describe("Testing beforeCreateServerAppModule hook", () => {
  let plugin: SupertokensAuthPlugin;
  let context: DsgContext;
  let params: CreateServerAppModuleParams;
  let moduleMap: ModuleMap;

  beforeEach(() => {
    plugin = new SupertokensAuthPlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
      serverDirectories: {
        srcDirectory: "",
      },
      logger: mock<BuildLogger>(),
    });
    params = {
      ...mock<CreateServerAppModuleParams>(),
      template: parse(`
            import { Module, Scope } from "@nestjs/common";
            import { APP_INTERCEPTOR } from "@nestjs/core";
            import { MorganInterceptor } from "nest-morgan";

            declare const MODULES: any;
            `),
      templateMapping: {
        MODULES: builders.arrayExpression([]),
      },
    };
    moduleMap = new ModuleMap(context.logger);
    moduleMap.set({
      path: "/app.module.ts",
      code: prettyCode(beforeGraphqlSetting),
    });
  });
  it("should add the necessary imports to the file", () => {
    const { template } = plugin.beforeCreateServerAppModule(context, params);
    const expectedCode = prettyCode(`
        import { Module, Scope } from "@nestjs/common";
        import { APP_INTERCEPTOR } from "@nestjs/core";
        import { MorganInterceptor } from "nest-morgan";
        import { generateSupertokensOptions } from "./auth/supertokens/generateSupertokensOptions";

        declare const MODULES: any;
        `);
    const templateCode = recast.prettyPrint(template).code;
    expect(templateCode).toBe(expectedCode);
  });
  it("should add the necessary graphql settings", async () => {
    const modules = await plugin.afterCreateServerAppModule(
      context,
      params,
      moduleMap,
    );
    const expectedCode = prettyCode(afterGraphqlSetting);
    expect(modules.get("/app.module.ts").code).toBe(expectedCode);
  });
});

const beforeGraphqlSetting = `
    import { AuthModule } from "./auth/auth.module";

    @Module({
        controllers: [],
        imports: [
            GraphQLModule.forRootAsync({
                useFactory: (configService) => {
                        const playground = configService.get("GRAPHQL_PLAYGROUND");
                        const introspection = configService.get("GRAPHQL_INTROSPECTION");
                        return {
                        autoSchemaFile: "schema.graphql",
                        sortSchema: true,
                        playground,
                        introspection: playground || introspection,
                    };
                },
                inject: [ConfigService],
                imports: [ConfigModule],
            })
        ],
        providers: []
    })
    export class AppModule {}
`;

const afterGraphqlSetting = `
    import { AuthModule } from "./auth/auth.module";

    @Module({
        controllers: [],
        imports: [
            GraphQLModule.forRootAsync({
                useFactory: (configService) => {
                    const playground = configService.get("GRAPHQL_PLAYGROUND");
                    const introspection = configService.get("GRAPHQL_INTROSPECTION");
                    return {
                        autoSchemaFile: "schema.graphql",
                        sortSchema: true,
                        introspection: playground || introspection,
                        playground: false,
                        cors: {
                            origin: generateSupertokensOptions(configService).appInfo.websiteDomain,
                            credentials: true
                        }
                    };
                },
                inject: [ConfigService],
                imports: [ConfigModule],
            })
        ],
        providers: []
    })
    export class AppModule {}
`;

export const removeSemicolon = (stmt: string) => {
  if (stmt.length === 0) {
    throw new Error("This isn't a statement");
  }
  if (stmt[stmt.length - 1] !== ";") {
    throw new Error(
      "This statement doesn't end in a semicolon. No semicolon to remove",
    );
  }
  return stmt.slice(0, -1);
};
