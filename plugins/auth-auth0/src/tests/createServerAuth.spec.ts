import { mock } from "jest-mock-extended";
import fg from "fast-glob";
import * as fs from "fs";
import { DsgContext, ModuleMap, BuildLogger } from "@amplication/code-gen-types";
import { afterCreateAuthModules } from "@events/createServerAuth";

describe("Testing afterCreateApp hook", () => {
  let context: DsgContext;
  let modules: ModuleMap;
  let logger: BuildLogger;

  beforeEach(() => {
    logger = mock<BuildLogger>();
    context = mock<DsgContext>(
      {
        resourceInfo: {
          settings: {
            authEntityName: "User",
          },
        },
        entities: [
          {
            name: "User",
          },
        ],
        logger: {
          info: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
        },
        pluginInstallations: [{
          npm: "@amplication/plugin-auth-auth0",
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

  it("should create all the auth modules", async () => {
    const newModules = await afterCreateAuthModules(context, {}, modules);

    expect(newModules.modules()).toMatchSnapshot();
  });

  it("should remove the default auth modules", async () => {
    const newModules = await afterCreateAuthModules(context, {}, modules);
    const filesToRemove: string[] = [
      "auth.controller.ts",
      "auth.service.ts",
      "auth.service.spec.ts",
      "constants.ts",
      "ITokenService.ts",
      "LoginArgs.ts",
      "password.service.ts",
      "password.service.spec.ts",
      "token.service.ts",
    ];

    filesToRemove.forEach((file) => {
      expect(newModules.get(file)).toBeFalsy();
    });
  });
});
