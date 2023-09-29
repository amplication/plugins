import { CreateEntityModuleParams, CreateServerParams, DsgContext, ModuleMap } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { parse } from "@amplication/code-gen-utils";
import { builders } from "ast-types"
import * as recast from "recast"
import { prettyCode } from "../utils"
import SupertokensAuthPlugin from "../index";
import { print } from "@amplication/code-gen-utils";
import { name } from "../../package.json";

describe("Testing afterCreateEntityModule hook", () => {
    let plugin: SupertokensAuthPlugin;
    let context: DsgContext;
    let params: CreateEntityModuleParams;
    let moduleMap: ModuleMap;

    beforeEach(() => {
        plugin = new SupertokensAuthPlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{ npm: name }],
            serverDirectories: {
                srcDirectory: "/",
                authDirectory: "/auth"
            },
            entities: [
                {
                    name: "TheEntity"
                }
            ],
            resourceInfo: {
                settings: {
                    authEntityName: "TheEntity"
                }
            }
        });
        params = {
            ...mock<CreateEntityModuleParams>(),
            templateMapping: {
                MODULE: builders.identifier("TheEntityModule")
            },
            entityName: "TheEntity"
        }
        moduleMap = new ModuleMap(context.logger);
    });
    it("should add the auth module to the auth directory", async () => {
        const modules = await plugin.afterCreateEntityModule(context, params, moduleMap);
        let expectedCode = prettyCode(authModuleRaw);
        const code = prettyCode(modules.get("/auth/auth.module.ts").code);
        expect(code).toStrictEqual(expectedCode);
    });
});

const authModuleRaw = `
import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  NestModule
} from "@nestjs/common";
import { PasswordService } from "./password.service";
import { STAuthMiddleware } from "./supertokens/auth.middleware";
import { AuthService } from "./auth.service";
import { TheEntityModule } from "../TheEntity/TheEntity.module";

@Module({
  providers: [AuthService, PasswordService],
  imports: [forwardRef(() => TheEntityModule)],
  exports: [PasswordService, AuthService]
})
export class AuthModule implements NestModule {

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(STAuthMiddleware).forRoutes("*");
  }
}
`;
