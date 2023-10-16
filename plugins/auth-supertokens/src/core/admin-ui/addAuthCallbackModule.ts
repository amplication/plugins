import { ModuleMap } from "@amplication/code-gen-types";
import { print, readFile } from "@amplication/code-gen-utils";
import { resolve, join } from "path";
import { staticsPath } from "../../constants";

export const addAuthCallbackModule = async (
    srcDirectory: string,
    modules: ModuleMap
) => {
    const filename = "AuthCallback.tsx";
    const path = resolve(staticsPath, "admin-ui", "thirdparty", filename);
    modules.set({
        path: `${srcDirectory}/${filename}`,
        code: print(await readFile(path)).code
    });
}
