import { DsgContext, ModuleMap } from "@amplication/code-gen-types";
import { resolve, join } from "path";
import { readFile, print } from "@amplication/code-gen-utils";
import * as constants from "../constants";
import { getPluginSettings } from "../utils";


export const addRemoveAuthFiles = async (
    context: DsgContext,
    modules: ModuleMap
) => {
    const { authDirectory, srcDirectory } = context.serverDirectories;

    const newModules = removeUnneededFiles(
      context,
      modules,
      authDirectory,
      srcDirectory
    );

    const supertokensDirectory = join(authDirectory, "supertokens");

    await addSupertokensFiles(newModules, supertokensDirectory);

    const settings = getPluginSettings(context.pluginInstallations);
    if(settings.recipe.name === "phonepassword") {
      await addPhonePasswordSpecificFiles(newModules, supertokensDirectory);
    }

    await addOtherAuthFiles(newModules, authDirectory);

    return newModules;
}

const removeUnneededFiles = (
  context: DsgContext,
  modules: ModuleMap,
  authDirectory: string,
  srcDirectory: string
) => {
  const unneededInAuth = [
    "token.service.ts",
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
    if(unneededInAuth.find((filename) => `${authDirectory}/${filename}` === module.path)) {
      continue;
    }
    if(module.path === `${srcDirectory}/tests/auth/constants.ts`) {
      continue;
    }
    newModules.set(module);
  }

  return newModules;
}

const addSupertokensFiles = async (
  newModules: ModuleMap,
  supertokensDirectory: string
) => {
  const fileNames = [
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
    await newModules.set({
      code: print(file).code,
      path: join(supertokensDirectory, name)
    });
  }
}

const addPhonePasswordSpecificFiles = async (
  newModules: ModuleMap,
  supertokensDirectory: string
) => {
  const name = "phoneVerifiedClaim.ts";
  const filePath = resolve(constants.staticsPath, "supertokens", "phonepassword", name);
  const file = await readFile(filePath);
  await newModules.set({
    code: print(file).code,
    path: join(supertokensDirectory, name)
  });
}

const addOtherAuthFiles = async (
  newModules: ModuleMap,
  authDirectory: string
) => {
  const authGuardFileName = "defaultAuth.guard.ts";
  const filePath = resolve(constants.staticsPath, authGuardFileName);
  const file = await readFile(filePath);
  await newModules.set({
      path: join(authDirectory, authGuardFileName),
      code: print(file).code
  });
}
