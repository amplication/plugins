import { ModuleMap } from "@amplication/code-gen-types";
import { print, readFile } from "@amplication/code-gen-utils";
import { resolve } from "path";
import { staticsPath } from "../../constants";
import { Settings } from "../../types";

export const replaceLoginPage = async (
    srcDirectory: string,
    modules: ModuleMap,
    recipeName: Settings["recipe"]["name"]
) => {
    const loginPath = resolve(staticsPath, "admin-ui", recipeName, "Login.tsx");
    const newLoginCode = await readFile(loginPath);
    const oldLoginModule = modules.get(`${srcDirectory}/Login.tsx`);
    modules.replace(oldLoginModule, {
        path: oldLoginModule.path,
        code: print(newLoginCode).code
    });
}
