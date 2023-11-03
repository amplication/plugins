import {
  CreateServerAuthParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { serverStaticPath } from "../constants";
import {
  createAuthModule,
  createAuthResolver,
  createJwtStrategy,
  createJwtStrategyBase,
} from "../core";

export const beforeCreateAuthModules = (
  context: DsgContext,
  eventParams: CreateServerAuthParams,
) => {
  context.utils.skipDefaultBehavior = true;
  return eventParams;
};

export const afterCreateAuthModules = async (
  context: DsgContext,
  eventParams: CreateServerAuthParams,
  modules: ModuleMap,
) => {
  const staticFiles = await context.utils.importStaticModules(
    serverStaticPath,
    context.serverDirectories.srcDirectory,
  );

  // 1. Create JWT strategy
  const { module: jwtStrategy, searchableAuthField } =
    await createJwtStrategy(context);
  modules.set(jwtStrategy);

  // 2. Create JWT strategy base
  const jwtStrategyBase = await createJwtStrategyBase(
    context,
    searchableAuthField,
  );
  modules.set(jwtStrategyBase);

  // 3. Create auth module
  const authModule = await createAuthModule(context);
  modules.set(authModule);

  // 4. Create auth resolver
  const authResolver = await createAuthResolver(context);
  modules.set(authResolver);

  await modules.merge(staticFiles);

  // Remove array of files
  const filesToRemove: string[] = [
    "auth.controller.ts",
    "auth.service.ts",
    "auth.service.spec.ts",
    "constants.ts",
    "ITokenService.ts",
    "LoginArgs.ts",
    "password.service.ts",
    "password.service.spec.ts",
    "token.service.ts",
  ];
  modules.removeMany(
    filesToRemove.map(
      (file) => `${context.serverDirectories.authDirectory}/${file}`,
    ),
  );
  return modules;
};
