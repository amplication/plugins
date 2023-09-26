import {
  CreateServerAuthParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { serverStaticPath } from "../constants";
import {
  createAuthModule,
  createJwtStrategy,
  createJwtStrategyBase,
} from "../core";

export const beforeCreateAuthModules = (
  context: DsgContext,
  eventParams: CreateServerAuthParams
) => {
  context.utils.skipDefaultBehavior = true;
  return eventParams;
};

export const afterCreateAuthModules = async (
  context: DsgContext,
  eventParams: CreateServerAuthParams,
  modules: ModuleMap
) => {
  const staticFiles = await context.utils.importStaticModules(
    serverStaticPath,
    context.serverDirectories.srcDirectory
  );

  // 1. Create JWT strategy
  const jwtStrategy = await createJwtStrategy(context);
  modules.set(jwtStrategy);

  // 2. Create JWT strategy base
  const jwtStrategyBase = await createJwtStrategyBase(context);
  modules.set(jwtStrategyBase);

  // 3. Create auth module
  const authModule = await createAuthModule(context);
  modules.set(authModule);

  await modules.merge(staticFiles);
  
  // Remove array of files
  const filesToRemove : string[] = ["auth.controller.ts"];
  modules.removeMany(filesToRemove);
  return modules;
};
