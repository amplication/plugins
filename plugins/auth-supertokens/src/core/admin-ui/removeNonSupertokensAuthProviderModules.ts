import { ModuleMap } from "@amplication/code-gen-types";

export const removeNonSupertokensAuthProviderModules = (
    srcDirectory: string,
    modules: ModuleMap
) => {
    modules.removeMany(
        ["ra-auth-http.ts", "ra-auth-jwt.ts"]
        .map((filename) => `${srcDirectory}/auth-provider/${filename}`)
    )
}
