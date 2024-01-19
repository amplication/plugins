import {
  CreateServerAppModuleParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import { builders } from "ast-types";
import * as utils from "../util/ast";
import RabbitMQPlugin from "../index";
import path from "path";

describe("Testing beforeCreateServerAppModule hook", () => {
  let plugin: RabbitMQPlugin;
  let context: DsgContext;
  let params: CreateServerAppModuleParams;

  beforeEach(() => {
    plugin = new RabbitMQPlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
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
        MODULES: builders.arrayExpression([]),
      },
      modulesFiles: new ModuleMap(context.logger),
    };
    RabbitMQPlugin.moduleFile = {
      code: "",
      path: path.join(".", "rabbitmq", "rabbitmq.module"),
    };
  });
  it("should add the necessary imports to the file", () => {
    const { template } = plugin.beforeCreateServerAppModule(context, params);
    const expectedCode = utils.prettyCode(`
        import { Module, Scope } from "@nestjs/common";
        import { APP_INTERCEPTOR } from "@nestjs/core";
        import { MorganInterceptor } from "nest-morgan";
        import { RabbitMQModule } from "./rabbitmq/rabbitmq.module";
        declare const MODULES: any;
        `);
    const templateCode = utils.prettyPrint(template).code;
    expect(templateCode).toBe(expectedCode);
  });
  it("should add the rabbit module to modules list", () => {
    const { templateMapping } = plugin.beforeCreateServerAppModule(
      context,
      params
    );
    const expectedModules = "[RabbitMQModule]";
    const modulesCode = utils.prettyPrint(templateMapping.MODULES).code;
    expect(modulesCode).toBe(expectedModules);
  });
});
