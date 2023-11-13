import { BuildLogger, ModuleMap } from "@amplication/code-gen-types";

export const removeNonSupertokensAuthProviderModules = (
  srcDirectory: string,
  modules: ModuleMap,
  logger: BuildLogger
) => {
  logger.info("Removing the non-SuperTokens auth providers from the admin UI");
  modules.removeMany(
    ["ra-auth-http.ts", "ra-auth-jwt.ts"].map(
      (filename) => `${srcDirectory}/auth-provider/${filename}`
    )
  );
};
