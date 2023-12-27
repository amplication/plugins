import { BuildLogger, ModuleMap } from "@amplication/code-gen-types";
import { resolve, join } from "path";
import { readFile, print } from "@amplication/code-gen-utils";
import { staticsPath } from "../../constants";
import { PasswordlessFlowType, Settings } from "../../types";

export const addSupertokensAuthProvider = async (
  srcDirectory: string,
  modules: ModuleMap,
  settings: Settings,
  logger: BuildLogger
) => {
  logger.info(
    "Adding the SuperTokens auth provider for react-admin authentication in the admin UI"
  );
  const supertokensAuthProviderCode = await getSupertokensAuthProviderCode(
    settings
  );
  modules.set({
    path: join(srcDirectory, "auth-provider", "ra-auth-supertokens.ts"),
    code: supertokensAuthProviderCode,
  });
};

const getSupertokensAuthProviderCode = async (settings: Settings) => {
  if (
    settings.recipe.name === "passwordless" ||
    settings.recipe.name === "thirdpartypasswordless"
  ) {
    return await getPasswordlessAuthProviderCode(settings);
  }
  const path = resolve(
    staticsPath,
    "admin-ui",
    settings.recipe.name,
    "ra-auth-supertokens.ts"
  );
  return print(await readFile(path)).code;
};

const getPasswordlessAuthProviderCode = async (settings: Settings) => {
  if (
    settings.recipe.name !== "passwordless" &&
    settings.recipe.name !== "thirdpartypasswordless"
  ) {
    throw new Error("Expected only passwordless recipe");
  }
  const { flowType, name } = settings.recipe;
  const flowTypeToSubDir: { [key in PasswordlessFlowType]: string } = {
    USER_INPUT_CODE: "otp_and_or_magiclink",
    MAGIC_LINK: "magiclink",
    USER_INPUT_CODE_AND_MAGIC_LINK: "otp_and_or_magiclink",
  };
  const path = resolve(
    staticsPath,
    "admin-ui",
    name,
    flowTypeToSubDir[flowType],
    "ra-auth-supertokens.ts"
  );
  return print(await readFile(path)).code;
};
