import {
  DsgContext,
  ModuleMap,
  BuildLogger,
} from "@amplication/code-gen-types";
import PrettierPlugin from "..";
import { mock } from "jest-mock-extended";
import fg from "fast-glob";
import * as fs from "fs";

describe("Testing afterCreateApp hook", () => {
  let plugin: PrettierPlugin;
  let context: DsgContext;
  let modules: ModuleMap;
  let logger: BuildLogger;

  beforeEach(() => {
    plugin = new PrettierPlugin();
    logger = mock<BuildLogger>();
    context = mock<DsgContext>({
      pluginInstallations: [
        {
          npm: "@amplication/plugin-formatter-prettier",
        },
      ],
      utils: {
        importStaticModules: async (source, basePath) => {
          const directory = `${source}/`;
          const staticModules = await fg(`${directory}**/*`, {
            absolute: false,
            dot: true,
            ignore: ["**.js", "**.js.map", "**.d.ts"],
          });

          const modules = await Promise.all(
            staticModules.sort().map(async (module) => {
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
        },
      },
    });
    modules = new ModuleMap(logger);
  });

  it("should use default settings if no settings are provided", async () => {
    const StaticModules = await plugin.afterCreateApp("client")(
      context,
      {},
      modules
    );
    // snapshot the module map
    expect(StaticModules.modules()).toMatchSnapshot();
  });

  it("should use provided settings", async () => {
    context.pluginInstallations[0].npm =
      "@amplication/plugin-formatter-prettier";
    context.pluginInstallations[0].settings = {
      rules: {
        semi: false,
        singleQuote: true,
        trailingComma: "es5",
        printWidth: 120,
        tabWidth: 2,
      },
    };

    const StaticModules = await plugin.afterCreateApp("client")(
      context,
      {},
      modules
    );
    // snapshot the module map
    expect(StaticModules.modules()).toMatchSnapshot();
  });
});
