import {
  AmplicationPlugin,
  CreateAdminUIParams,
  CreateServerAuthParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { EnumAuthProviderType } from "@amplication/code-gen-types/src/models";
import { resolve } from "path";
import {
  createAuthModule,
  createJwtStrategy,
  createJwtStrategyBase,
} from "./core";
class JwtAuthPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      CreateAdminUI: {
        before: this.beforeCreateAdminModules,
      },
      CreateServerAuth: {
        before: this.beforeCreateAuthModules,
        after: this.afterCreateAuthModules,
      },
    };
  }

  beforeCreateAdminModules(
    context: DsgContext,
    eventParams: CreateAdminUIParams
  ) {
    if (context.resourceInfo) {
      context.resourceInfo.settings.authProvider = EnumAuthProviderType.Jwt;
    }

    return eventParams;
  }

  beforeCreateAuthModules(
    context: DsgContext,
    eventParams: CreateServerAuthParams
  ) {
    context.utils.skipDefaultBehavior = true;
    return eventParams;
  }

  async afterCreateAuthModules(
    context: DsgContext,
    eventParams: CreateServerAuthParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const staticPath = resolve(__dirname, "./static");

    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.srcDirectory
    );

    // 1. create jwtStrategy base file.
    const jwyStrategyBase = await createJwtStrategyBase(context);
    await modules.set(jwyStrategyBase);

    // 2. create jwtStrategy  file.
    const jwyStrategy = await createJwtStrategy(context);
    await modules.set(jwyStrategy);

    // 3. create auth module  file.
    const authModule = await createAuthModule(context);
    await modules.set(authModule);

    await modules.merge(staticsFiles);
    return modules;
  }
}

export default JwtAuthPlugin;
