import {
    CreateEntityModuleParams,
    DsgContext
} from "@amplication/code-gen-types";
import { parse } from "@amplication/code-gen-utils";
import { mock } from "jest-mock-extended";
import { prettyPrint } from "recast";
import { name } from "../../package.json";
import AuthCorePlugin from "../index";
import { builders } from "ast-types";

describe("Testing beforeCreateEntityModule hook", () => {
  let plugin: AuthCorePlugin;
  let context: DsgContext;
  let params: CreateEntityModuleParams;

  beforeEach(() => {
    plugin = new AuthCorePlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
    params = {
        ...mock<CreateEntityModuleParams>(),
        template: parse(templateBefore),
        templateMapping: {
            MODULE_BASE: builders.identifier("TheModuleBase"),
            CONTROLLER: builders.identifier("TheControllerBase"),
            PROVIDERS_ARRAY: builders.arrayExpression([
                builders.identifier("TheService"),
                builders.identifier("TheResolver")
            ]),
            SERVICE: builders.identifier("TheService"),
            MODULE: builders.identifier("TheModule")
        }
    };
  });
  it("should correctly alter the entity module", async () => {
    const { template } = await plugin.beforeCreateEntityModule(context, params);
    const code = prettyPrint(template).code;
    const expectedCode = prettyCode(correctTemplate);
    expect(code).toStrictEqual(expectedCode);
  });
});

const templateBefore = `import { Module } from "@nestjs/common";

@Module({
  imports: [MODULE_BASE],
  controllers: [CONTROLLER],
  providers: PROVIDERS_ARRAY,
  exports: [SERVICE],
})
export class MODULE {}

`

const correctTemplate = `import { Module, forwardRef } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";

@Module({
    imports: [TheModuleBase, forwardRef(() => AuthModule)],
    controllers: [TheControllerBase],
    providers: [TheService, TheResolver],
    exports: [TheService],
})
export class TheModule {}
`

const prettyCode = (code: string) => prettyPrint(parse(code)).code;
