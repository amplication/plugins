import { ModuleMap } from "@amplication/code-gen-types";
import { join } from "lodash";

export const removeUnneededAdminUIFiles = (
    srcDirectory: string,
    modules: ModuleMap
) => {
    const unneededFilenames = [
        "auth.ts",
        "constants.ts",
        join("auth-provider", "ra-auth-http.ts"),
        join("auth-provider", "ra-auth-jwt.ts")
    ];
    modules.removeMany(
        unneededFilenames.map((filename) => `${srcDirectory}/${filename}`)
    );
}
