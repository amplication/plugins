import {
  CreateServerAppModuleParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { beforeCreateServerAppModule } from "@events/createAppModule";
import { mock } from "jest-mock-extended";
import { builders } from "ast-types";
import * as recast from "recast";

describe("Testing createApp hook", () => {
  let context: DsgContext;
  let eventParams: CreateServerAppModuleParams;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [
        { npm: "@amplication/plugin-observability-opentelemetry" },
      ],
      resourceInfo: {
        name: "sample-service",
      },
    });
    eventParams = mock<CreateServerAppModuleParams>({
      template: builders.file(builders.program([])),
      templateMapping: {
        MODULES: builders.arrayExpression([]),
      },
    });
  });

  it("should add the necessary imports", () => {
    const { template } = beforeCreateServerAppModule(context, eventParams);
    const templateCode = recast.prettyPrint(template).code;

    expect(templateCode).toMatchSnapshot();
  });

  it("should add the opentelemetry module to the modules list", () => {
    const { templateMapping } = beforeCreateServerAppModule(
      context,
      eventParams,
    );

    const moduleCode = recast.prettyPrint(templateMapping["MODULES"]).code;
    expect(moduleCode).toMatchSnapshot();
  });

  it("should use the service name from the plugin settings if defined", () => {
    context.pluginInstallations[0].settings = {
      serviceName: "my-service",
    };

    const { templateMapping } = beforeCreateServerAppModule(
      context,
      eventParams,
    );

    const moduleCode = recast.prettyPrint(templateMapping["MODULES"]).code;
    expect(moduleCode.includes("my-service")).toBeTruthy();
  });
});
