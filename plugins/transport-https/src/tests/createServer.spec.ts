import { mock } from "jest-mock-extended";
import fg from "fast-glob";
import * as fs from "fs";
import {
  DsgContext,
  ModuleMap,
  BuildLogger,
} from "@amplication/code-gen-types";
import TransportHttpsPlugin from "..";

describe("Testing createServer hook", () => {
  let context: DsgContext;
  let modules: ModuleMap;
  let logger: BuildLogger;
  const plugin = new TransportHttpsPlugin();

  beforeEach(() => {
    logger = mock<BuildLogger>();
    modules = new ModuleMap(logger);
    context = mock<DsgContext>({
      serverDirectories: {
        baseDirectory: "",
        srcDirectory: "src",
      },
      pluginInstallations: [
        {
          npm: "@amplication/plugin-transport-https",
        },
      ],
      logger,
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
  })

  it("should use default values if plugin settings are not defined", async () => {
    await plugin.afterCreateServer(context, {}, modules);

    // create snapshot of the generated files
    expect(modules.modules()).toMatchSnapshot();
  });

  it("should use plugin settings if defined", async () => {
    context.pluginInstallations[0].settings = {
      appMode: "https",
      httpsPort: 8443,
      httpsCertName: "custom-server.crt",
      httpsKeyName: "custom-server.key",
      httpsCertDir: "custom-certs",
      caKeyName: "custom-ca.key",
      caCertName: "custom-ca.crt",
    };

    await plugin.afterCreateServer(context, {}, modules);

    // create snapshot of the generated files

    expect(modules.modules()).toMatchSnapshot();
  });
});
