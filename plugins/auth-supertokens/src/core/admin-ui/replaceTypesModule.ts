import { ModuleMap } from "@amplication/code-gen-types";
import { print, readFile } from "@amplication/code-gen-utils";
import { resolve } from "path";
import { staticsPath } from "../../constants";
import { Settings } from "../../types";

export const replaceTypesModule = async (
    srcDirectory: string,
    modules: ModuleMap,
    recipeName: Settings["recipe"]["name"]
) => {
    const typesPath = resolve(staticsPath, "admin-ui", recipeName, "types.ts");
    const newTypesCode = await readFile(typesPath);
    const oldTypesModule = modules.get(`${srcDirectory}/types.ts`);
    modules.replace(oldTypesModule, {
        path: oldTypesModule.path,
        code: print(newTypesCode).code
    });
}
