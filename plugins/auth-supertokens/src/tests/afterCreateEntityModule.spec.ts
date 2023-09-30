import { CreateEntityModuleParams, DsgContext, ModuleMap } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { builders } from "ast-types"
import { prettyCode } from "../utils"
import SupertokensAuthPlugin from "../index";
import { name } from "../../package.json";

describe("Testing afterCreateEntityModule hook", () => {
    let plugin: SupertokensAuthPlugin;
    let context: DsgContext;
    let params: CreateEntityModuleParams;
    let moduleMap: ModuleMap;

    beforeEach(() => {
        plugin = new SupertokensAuthPlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{
                npm: name,
                settings: { emailFieldName: "theEmail", passwordFieldName: "thePassword" }
            }],
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
                MODULE: builders.identifier("TheEntityModule"),
                SERVICE: builders.identifier("TheEntityService"),
                ENTITY: builders.identifier("TheEntity")
            },
            entityName: "theEntity"
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
import { TheEntityModule } from "../theEntity/theEntity.module";

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
