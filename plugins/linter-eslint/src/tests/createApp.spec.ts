import { mock } from "jest-mock-extended";
import fg from "fast-glob";
import * as fs from "fs";
import { DsgContext, ModuleMap, BuildLogger } from "@amplication/code-gen-types";
import { afterCreateApp } from "../events";

describe("Testing afterCreateApp hook", () => {
  let context: DsgContext;
  let modules: ModuleMap;
  let logger: BuildLogger;

  beforeEach(() => {
    logger = mock<BuildLogger>();
    context = mock<DsgContext>(
      {
        pluginInstallations: [{
          npm: "@amplication/plugin-linter-eslint",
        }],
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
      }
    );
    modules = new ModuleMap(logger);
  });

  it("should use default settings if no settings are provided", async () => {
    const StaticModules = await afterCreateApp("client")(context, {}, modules);
    // snapshot the module maps
    expect(StaticModules.modules()).toMatchSnapshot();
  });

  it("should add prettier to extends if formatter is prettier", async () => {
    context.pluginInstallations[0].settings = {
      formatter: "prettier",
    };

    const StaticModules = await afterCreateApp("client")(context, {}, modules);
    // snapshot the module maps
    expect(StaticModules.modules()).toMatchSnapshot();
  });


  it("should use provided settings", async () => {
    context.pluginInstallations[0].settings = {
      rules: {
        "indent": [ "error", 4 ],
        "linebreak-style": [ "error", "unix" ],
        "quotes": [ "error", "single" ]
      },
    };

    const StaticModules = await afterCreateApp("client")(context, {}, modules);
    // snapshot the module maps
    expect(StaticModules.modules()).toMatchSnapshot();
  });      
});


