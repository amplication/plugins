import { resolve } from "path";
import {
  DsgContext,
  CreateAuthModulesParams,
  AmplicationPlugin,
  Events,
  CreateAdminModulesParams,
} from "@amplication/code-gen-types";
import { EnumAuthProviderType } from "@amplication/code-gen-types/dist/models";

class JwtAuthPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      createAdminModules: {
        before: this.beforeCreateAdminModules,
      },
      createAuthModules: {
        before: this.beforeCreateAuthModules,
        after: this.afterCreateAuthModules,
      },
    };
  }

  beforeCreateAdminModules(
    context: DsgContext,
    eventParams: CreateAdminModulesParams
  ) {
    if (context.resourceInfo) {
      context.resourceInfo.settings.authProvider = EnumAuthProviderType.Jwt;
    }

    return eventParams;
  }

  beforeCreateAuthModules(
    context: DsgContext,
    eventParams: CreateAuthModulesParams
  ) {
    context.utils.skipDefaultBehavior = true;
    return eventParams;
  }

  async afterCreateAuthModules(
    context: DsgContext,
    eventParams: CreateAuthModulesParams
  ) {
    const staticPath = resolve(__dirname, "../static");
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.srcDirectory
    );

    return staticsFiles;
  }
}

export default JwtAuthPlugin;
