import { ModuleMap } from "@amplication/code-gen-types";
import { resolve, join } from "path";
import { readFile, print } from "@amplication/code-gen-utils";
import { staticsPath } from "../../constants";
import { Settings } from "../../types";

export const addSupertokensAuthProvider = async (
    srcDirectory: string,
    modules: ModuleMap,
    recipeName: Settings["recipe"]["name"]
) => {
    const supertokensConfigPath = resolve(staticsPath, "admin-ui", recipeName, "ra-auth-supertokens.ts");
    const file = await readFile(supertokensConfigPath);
    modules.set({
      path: join(srcDirectory, "auth-provider", "ra-auth-supertokens.ts"),
      code: print(file).code
    });
}
