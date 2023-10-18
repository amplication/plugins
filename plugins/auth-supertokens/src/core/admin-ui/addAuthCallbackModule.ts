import { ModuleMap } from "@amplication/code-gen-types";
import { print, readFile } from "@amplication/code-gen-utils";
import { resolve } from "path";
import { staticsPath } from "../../constants";
import { Settings } from "../../types";

export const addAuthCallbackModule = async (
    srcDirectory: string,
    modules: ModuleMap,
    recipeName: Settings["recipe"]["name"]
) => {
    const filename = "AuthCallback.tsx";
    if(recipeName !== "thirdparty" && recipeName !== "thirdpartyemailpassword"
        && recipeName !== "thirdpartypasswordless") {
            throw new Error("Unexpected recipe while adding the auth callback module");
        }
    const path = resolve(staticsPath, "admin-ui", recipeName, filename);
    modules.set({
        path: `${srcDirectory}/${filename}`,
        code: print(await readFile(path)).code
    });
}
