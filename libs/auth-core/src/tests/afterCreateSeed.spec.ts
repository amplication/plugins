import {
  BuildLogger,
  CreateSeedParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import normalize from "normalize-path";
import path from "path";
import fg from "fast-glob";
import * as fs from "fs";
import { name } from "../../package.json";
import AuthCorePlugin from "../index";

describe("Testing afterCreateSeed hook", () => {
  let plugin: AuthCorePlugin;
  let context: DsgContext;
  let params: CreateSeedParams;
  let modules: ModuleMap;

  beforeEach(() => {
    plugin = new AuthCorePlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
      serverDirectories: { scriptsDirectory: "scripts" },
      utils: {
        importStaticModules: readStaticModulesInner,
      },
    });
    params = mock<CreateSeedParams>();
    modules = new ModuleMap(mock<BuildLogger>());
  });

  it("should correctly add static scripts files", async () => {
    const newModules = await plugin.afterCreateSeed(context, params, modules);
    expect(newModules.modules().length).toStrictEqual(0);
  });
});

/**
 * Reads files from given source directory and maps them to module objects with
 * path relative to given basePath
 * @param source source directory to read files from
 * @param basePath path to base the created modules path on
 * @returns array of modules
 */
export async function readStaticModulesInner(
  source: string,
  basePath: string
): Promise<ModuleMap> {
  const directory = `${normalize(source)}/`;
  const staticModules = await fg(`${directory}**/*`, {
    absolute: false,
    dot: true,
    ignore: ["**.js", "**.js.map", "**.d.ts"],
  });
  const filesToFilter = /(\._.*)|(.DS_Store)$/;
  const modules = await Promise.all(
    staticModules
      .sort()
      .filter(
        (module) =>
          !filesToFilter.test(
            module.replace(directory, basePath ? basePath + "/" : "")
          )
      )
      .map(async (module) => {
        const encoding = getFileEncoding(module);
        return {
          path: module.replace(directory, basePath ? basePath + "/" : ""),
          code: await fs.promises.readFile(module, encoding),
        };
      })
  );
  const moduleMap: ModuleMap = new ModuleMap(mock<BuildLogger>());
  for await (const module of modules) {
    await moduleMap.set(module);
  }
  return moduleMap;
}

export function getFileEncoding(filePath: string): BufferEncoding {
  const extension = path.extname(filePath);
  switch (extension) {
    case ".png":
    case ".ico":
    case ".jpg":
      return "base64";
    default:
      return "utf-8";
  }
}
