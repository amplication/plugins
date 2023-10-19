import { BuildLogger, ModuleMap } from "@amplication/code-gen-types";

export const removeNonSupertokensAuthProviderImportsFromAppModule = (
  srcDirectory: string,
  modules: ModuleMap,
  logger: BuildLogger
) => {
  logger.info(
    "Removing non-SuperTokens auth provider imports from the admin UI app module"
  );
  const appModule = modules.get(`${srcDirectory}/App.tsx`);
  if (!appModule) {
    throw new Error("Failed to find the app module");
  }
  const newAppCode = removeAuthProviderImports(appModule.code);
  modules.replace(appModule, {
    path: appModule.path,
    code: newAppCode,
  });
};

const removeAuthProviderImports = (code: string): string => {
  const lines = code.split("\n");
  let newLines = [];
  for (const line of lines) {
    if (line.includes("ra-auth-http") || line.includes("ra-auth-jwt")) {
      continue;
    }
    newLines.push(line);
  }
  return newLines.join("\n");
};
