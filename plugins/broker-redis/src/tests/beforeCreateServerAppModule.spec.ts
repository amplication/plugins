import {
  CreateServerAppModuleParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import { builders } from "ast-types";
import * as utils from "../utils";
import RedisBrokerPlugin from "../index";

describe("Testing beforeCreateServerAppModule hook", () => {
  let plugin: RedisBrokerPlugin;
  let context: DsgContext;
  let params: CreateServerAppModuleParams;

  beforeEach(() => {
    plugin = new RedisBrokerPlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
    params = {
      ...mock<CreateServerAppModuleParams>(),
      template: utils.parse(`
            import { Module } from "@nestjs/common";

            declare const MODULES: any;
            `),
      templateMapping: {
        MODULES: builders.arrayExpression([]),
      },
    };
  });
  it("should add the necessary imports to the file", () => {
    const { template } = plugin.beforeCreateServerAppModule(context, params);
    const expectedCode = utils.prettyCode(`
        import { RedisModule } from "./redis/redis.module";
        import { Module } from "@nestjs/common";

        declare const MODULES: any;
        `);
    const templateCode = utils.prettyPrint(template).code;
    expect(templateCode).toBe(expectedCode);
  });
  it("should add the redis module modules list", () => {
    const { templateMapping } = plugin.beforeCreateServerAppModule(
      context,
      params
    );
    let expectedModules = utils.prettyCode("[RedisModule]");
    // Remove the trailing semi-colon from the end which is inserted
    // by the prettyCode invocation
    expectedModules = utils.removeSemicolon(expectedModules);
    const modulesCode = utils.prettyPrint(templateMapping.MODULES).code;
    expect(modulesCode).toBe(expectedModules);
  });
});
