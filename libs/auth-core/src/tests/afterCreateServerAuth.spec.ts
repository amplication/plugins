import {
  BuildLogger,
  CreateServerAuthParams,
  DsgContext,
  EnumDataType,
  ModuleMap,
} from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import normalize from "normalize-path";
import path from "path";
import fg from "fast-glob";
import * as fs from "fs";
import { name } from "../../package.json";
import { afterCreateServerAuth } from "../events/create-server-auth";

describe("Testing afterCreateServerAuth hook", () => {
  let context: DsgContext;
  let params: CreateServerAuthParams;
  let modules: ModuleMap;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
      serverDirectories: {
        srcDirectory: "src",
        authDirectory: "src/auth",
        scriptsDirectory: "scripts",
      },
      entities: [
        {
          name: "AuthEntity",
          fields: [{ name: "id", dataType: EnumDataType.Id }],
        },
      ],
      resourceInfo: { settings: { authEntityName: "AuthEntity" } },
      utils: {
        importStaticModules: readStaticModulesInner,
      },
    });
    params = mock<CreateServerAuthParams>();
    modules = new ModuleMap(mock<BuildLogger>());
  });
  it("should add the necessary auth modules", async () => {
    const newModules = await afterCreateServerAuth(context, params, modules);
    const expectedModuleNames = [
      "src/auth/AuthEntityInfo.ts",
      "src/auth/ITokenService.ts",
      "src/tests/auth/constants.ts",
      "src/auth/auth.controller.ts",
      "src/auth/auth.resolver.ts",
      "src/auth/auth.service.ts",
      "src/auth/IAuthStrategy.ts",
      "src/auth/auth.service.spec.ts",
      "src/auth/userData.decorator.ts",
      "scripts/customSeed.ts",
      "src/interceptors/aclFilterResponse.interceptor.ts",
      "src/interceptors/aclValidateRequest.interceptor.ts",
      "src/auth/abac.util.ts",
      "src/auth/acl.module.ts",
      "src/auth/constants.ts",
      "src/auth/Credentials.ts",
      "src/auth/gqlAC.guard.ts",
      "src/auth/gqlUserRoles.decorator.ts",
      "src/auth/LoginArgs.ts",
      "src/auth/token.service.ts",
    ];
    for (const name of expectedModuleNames) {
      try {
        expect(newModules.get(name)).toBeTruthy();
      } catch (err) {
        throw new Error(`Failed to find the module ${name}`);
      }
    }
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
  const directory = `${normalize(source.replace("events/", ""))}/`;
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
