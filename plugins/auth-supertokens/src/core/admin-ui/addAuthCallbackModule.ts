import { BuildLogger, ModuleMap } from "@amplication/code-gen-types";
import { print, readFile } from "@amplication/code-gen-utils";
import { resolve } from "path";
import { staticsPath } from "../../constants";
import { Settings } from "../../types";

export const addAuthCallbackModule = async (
  srcDirectory: string,
  modules: ModuleMap,
  recipeName: Settings["recipe"]["name"],
  logger: BuildLogger
) => {
  logger.info(
    "Adding the auth callback module in the admin UI for third party logins"
  );
  const filename = "AuthCallback.tsx";
  if (
    recipeName !== "thirdparty" &&
    recipeName !== "thirdpartyemailpassword" &&
    recipeName !== "thirdpartypasswordless"
  ) {
    throw new Error("Unexpected recipe while adding the auth callback module");
  }
  const path = resolve(staticsPath, "admin-ui", recipeName, filename);
  modules.set({
    path: `${srcDirectory}/${filename}`,
    code: print(await readFile(path)).code,
  });
};
