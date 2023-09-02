import { CreateServerAppModuleParams, DsgContext } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { parse } from "@amplication/code-gen-utils";
import { builders } from "ast-types"
import * as recast from "recast"
import { prettyCode } from "../utils"
import SupertokensAuthPlugin from "../index";
import { name } from "../../package.json";

describe("Testing beforeCreateServerAppModule hook", () => {
    let plugin: SupertokensAuthPlugin;
    let context: DsgContext;
    let params: CreateServerAppModuleParams;

    beforeEach(() => {
        plugin = new SupertokensAuthPlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{ npm: name }]
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
        import { AuthModule } from './auth/auth.module';
        import { generateSupertokensOptions } from "./auth/generateSupertokensOptions";

        declare const MODULES: any;
        `)
        const templateCode = recast.prettyPrint(template).code
        expect(templateCode).toBe(expectedCode)

    })
    it("should add the auth module to the modules list", () => {
        const { templateMapping } = plugin.beforeCreateServerAppModule(context, params)
        let expectedModules = prettyCode(`
        [AuthModule.forRootAsync({
            useFactory: (configService) => {
                return generateSupertokensOptions(configService);
            }
        })]`);
        // Remove the trailing semi-colon from the end which is inserted
        // by the prettyCode invocation
        expectedModules = removeSemicolon(expectedModules)
        const modulesCode = recast.prettyPrint(templateMapping.MODULES).code;
        expect(modulesCode).toBe(expectedModules);
    });
});

export const removeSemicolon = (stmt: string) => {
  if(stmt.length === 0) {
    throw new Error("This isn't a statement")
  }
  if(stmt[stmt.length - 1] !== ";") {
    throw new Error("This statement doesn't end in a semicolon. No semicolon to remove")
  }
  return stmt.slice(0, -1)
}
