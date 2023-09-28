import { DsgContext, ModuleMap } from "@amplication/code-gen-types";
import { resolve, join } from "path";
import { readFile, print } from "@amplication/code-gen-utils";
import * as constants from "../constants";

export const addSupertokensFiles = async (context: DsgContext, modules: ModuleMap) => {
    const { authDirectory } = context.serverDirectories;

    const unneededInAuth = [
      "token.service.ts",
      "password.service.ts",
      "password.service.spec.ts",
      "LoginArgs.ts",
      "ITokenService.ts",
      "IAuthStrategy.ts",
      "Credentials.ts",
      "constants.ts",
      "auth.service.ts",
      "auth.service.spec.ts",
      "auth.controller.ts",
      "auth.resolver.ts"
    ];

    const newModules = new ModuleMap(context.logger);

    for(const module of modules.modules()) {
      if(unneededInAuth.find((val) => val === `${authDirectory}/${module.path}`)) {
        continue;
      }
      newModules.set(module);
    }

    const fileNames = [
      "supertokens.service.ts",
      "auth.filter.ts",
      "auth.guard.ts",
      "auth.middleware.ts",
      "config.interface.ts",
      "generateSupertokensOptions.ts",
      "session.decorator.ts",
      "auth.error.ts"
    ];

    for(const name of fileNames) {
      const filePath = resolve(constants.staticsPath, "supertokens", name);
      const file = await readFile(filePath);
      await modules.set({
        code: print(file).code,
        path: join(authDirectory, `supertokens/${name}`)
      });
    }

    return newModules;
}