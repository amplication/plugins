import {
  CreateServerAppModuleParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import { builders } from "ast-types";
import AuthCorePlugin from "../index";
import { parse } from "@amplication/code-gen-utils";
import { prettyPrint } from "recast";

describe("Testing beforeCreateServerAppModule hook", () => {
  let plugin: AuthCorePlugin;
  let context: DsgContext;
  let params: CreateServerAppModuleParams;

  beforeEach(() => {
    plugin = new AuthCorePlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
    params = {
      ...mock<CreateServerAppModuleParams>(),
      template: parse(`
            import { Module } from "@nestjs/common";

            declare const MODULES: any;
            `),
      templateMapping: {
        MODULES: builders.arrayExpression([]),
      },
    };
  });
  it("should add the necessary module IDs to the modules array", () => {
    const { templateMapping } = plugin.beforeCreateAppModule(
      context,
      params
    );
    let expectedModules = prettyCode("[ACLModule, AuthModule];").slice(0, -1);
    const modulesCode = prettyPrint(templateMapping.MODULES).code;
    expect(modulesCode).toBe(expectedModules);
  });
});

const prettyCode = (code: string) => prettyPrint(parse(code)).code;
