import { BuildLogger, DsgContext, LoadStaticFilesParams, ModuleMap } from "@amplication/code-gen-types";
import fg from "fast-glob";
import * as fs from "fs";
import { afterLoadStaticFiles } from "@events/loadStaticFiles";
import { mock } from "jest-mock-extended";

describe("Testing loadStaticFiles hook", () => {
  let context: DsgContext;
  let modules: ModuleMap;
  let logger: BuildLogger;
  let eventParams: LoadStaticFilesParams;

  beforeEach(() => {
    logger = mock<BuildLogger>();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: "@amplication/plugin-integrate-opentelemetry" }],
      utils: {
        importStaticModules: async (source, basePath) => {
          const directory = `${(source)}/`;
          const staticModules = await fg(`${directory}**/*`, {
            absolute: false,
            dot: true,
            ignore: ["**.js", "**.js.map", "**.d.ts"],
          });

          const modules = await Promise.all(
            staticModules
              .sort()
              .map(async (module) => {
                return {
                  path: module.replace(directory, basePath ? basePath + "/" : ""),
                  code: await fs.promises.readFile(module, "utf-8"),
                };
              })
          );

          const moduleMap: ModuleMap = new ModuleMap(logger);
          
          for await (const module of modules) {
            await moduleMap.set(module);
          }

          return moduleMap;
        }
      }
    });
    modules = new ModuleMap(logger);
    eventParams = mock<LoadStaticFilesParams>();
  });

  it("should use default settings if no settings are provided", async () => {
    const StaticModules = await afterLoadStaticFiles(context, eventParams, modules);
    // snapshot the module maps
    expect(StaticModules.modules()).toMatchSnapshot();
  });

  it("should use plugin settings if defined", async () => {
    context.pluginInstallations[0].settings = {
      JAEGER_AGENT_PORT: 1234,
      OTEL_COLLECTOR_PORT_GRPC: 1235,
      OTEL_COLLECTOR_PORT_HTTP: 1236,
    };

    const StaticModules = await afterLoadStaticFiles(context, eventParams, modules);
    // snapshot the module maps
    expect(StaticModules.modules()).toMatchSnapshot();
  });
});