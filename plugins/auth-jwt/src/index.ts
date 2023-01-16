import {
  AmplicationPlugin,
  CreateAdminUIParams,
  CreateServerAuthParams,
  DsgContext,
  Events,
} from "@amplication/code-gen-types";
import { EnumAuthProviderType } from "@amplication/code-gen-types/src/models";
import { staticsPath } from "./constants";
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
    eventParams: CreateServerAuthParams
  ) {
    const staticsFiles = await context.utils.importStaticModules(
      staticsPath,
      context.serverDirectories.srcDirectory
    );

    return staticsFiles;
  }
}

export default JwtAuthPlugin;
