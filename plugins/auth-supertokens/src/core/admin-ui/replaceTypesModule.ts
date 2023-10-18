import { ModuleMap } from "@amplication/code-gen-types";
import { print, readFile } from "@amplication/code-gen-utils";
import { resolve } from "path";
import { staticsPath } from "../../constants";
import { PasswordlessFlowType, Settings } from "../../types";

export const replaceTypesModule = async (
    srcDirectory: string,
    modules: ModuleMap,
    settings: Settings
) => {
    const newTypesCode = await getTypesCode(settings);
    const oldTypesModule = modules.get(`${srcDirectory}/types.ts`);
    modules.replace(oldTypesModule, {
        path: oldTypesModule.path,
        code: newTypesCode
    });
}

const getTypesCode = async (settings: Settings) => {
  if(settings.recipe.name === "passwordless"
    || settings.recipe.name === "thirdpartypasswordless") {
    return await getPasswordlessTypesCode(settings);
  }
  const path = resolve(staticsPath, "admin-ui", settings.recipe.name, "types.ts"); 
  return print(await readFile(path)).code;
}

const getPasswordlessTypesCode = async (settings: Settings) => {
  if(settings.recipe.name !== "passwordless"
    && settings.recipe.name !== "thirdpartypasswordless") {
    throw new Error("Expected only passwordless recipes");
  }
  const { flowType, name } = settings.recipe;
  const flowTypeToSubDir: {[key in PasswordlessFlowType]: string} = {
      "USER_INPUT_CODE": "otp_and_or_magiclink",
      "MAGIC_LINK": "magiclink",
      "USER_INPUT_CODE_AND_MAGIC_LINK": "otp_and_or_magiclink"
  }
  const path = resolve(staticsPath, "admin-ui", name,
    flowTypeToSubDir[flowType], "types.ts");
  return print(await readFile(path)).code;
}
