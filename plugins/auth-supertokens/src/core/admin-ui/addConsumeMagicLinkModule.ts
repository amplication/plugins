import { ModuleMap } from "@amplication/code-gen-types";
import { print, readFile } from "@amplication/code-gen-utils";
import { resolve } from "path";
import { staticsPath } from "../../constants";
import { Settings } from "../../types";

export const addConsumeMagicLinkModule = async (
    srcDirectory: string,
    modules: ModuleMap,
    recipeName: Settings["recipe"]["name"]
) => {
    const filename = "ConsumeSuperTokensMagicLink.tsx";
    if(recipeName !== "passwordless" && recipeName !== "thirdpartypasswordless") {
        throw new Error("Unexpected recipe for generation of consume magic link module");
    }
    const path = resolve(staticsPath, "admin-ui", recipeName, "magiclink", filename);
    modules.set({
        path: `${srcDirectory}/${filename}`,
        code: print(await readFile(path)).code
    })
}
