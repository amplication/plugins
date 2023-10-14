import { ModuleMap } from "@amplication/code-gen-types";
import { resolve, join } from "path";
import { readFile, print } from "@amplication/code-gen-utils";
import { staticsPath } from "../../constants";

export const addSupertokensConfigFile = async (
    srcDirectory: string,
    modules: ModuleMap
) => {
    const supertokensConfigPath = resolve(staticsPath, "admin-ui", "config.tsx");
    const file = await readFile(supertokensConfigPath);
    modules.set({
      path: join(srcDirectory, "config.tsx"),
      code: print(file).code
    });
}
