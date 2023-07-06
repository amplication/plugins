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
import { createAuthModule, createBasicStrategyBase } from "./core";
class BasicAuthPlugin implements AmplicationPlugin {
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
      context.resourceInfo.settings.authProvider = EnumAuthProviderType.Http;
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

    // 1. create basic strategy base file.
    const basicStrategyBase = await createBasicStrategyBase(context);
    await modules.set(basicStrategyBase);

    // 2. create auth module file.
    const authModule = await createAuthModule(context);
    await modules.set(authModule);

    await modules.merge(staticsFiles);
    return modules;
  }
}

export default BasicAuthPlugin;
