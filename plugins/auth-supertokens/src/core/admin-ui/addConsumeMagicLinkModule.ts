import { ModuleMap } from "@amplication/code-gen-types";
import { print, readFile } from "@amplication/code-gen-utils";
import { resolve } from "path";
import { staticsPath } from "../../constants";

export const addConsumeMagicLinkModule = async (
    srcDirectory: string,
    modules: ModuleMap
) => {
    const filename = "ConsumeSuperTokensMagicLink.tsx";
    const path = resolve(staticsPath, "admin-ui", "passwordless", 
        "magiclink", filename);
    modules.set({
        path: `${srcDirectory}/${filename}`,
        code: print(await readFile(path)).code
    })
}
