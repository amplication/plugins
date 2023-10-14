import {
  AmplicationPlugin,
  CreateAdminUIParams,
  CreateServerDotEnvParams,
  CreateServerDockerComposeParams,
  CreateServerDockerComposeDBParams,
  CreateServerAuthParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { getPluginSettings } from "./util/utils";
import { EnumAuthProviderType } from "@amplication/code-gen-types/src/models";
import { resolve } from "path";
import {
  createAuthModule,
  createKeycloakStrategy,
  createAuthResolver,
  createKeycloakStrategyBase,
} from "./core";
import {
  updateDockerComposeDevProperties,
  updateDockerComposeProperties,
} from "./constants";

class KeycloakAuthPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      CreateAdminUI: {
        before: this.beforeCreateAdminModules,
      },
      CreateServerDotEnv: {
        before: this.beforeCreateServerDotEnv,
      },
      CreateServerDockerCompose: {
        before: this.beforeCreateServerDockerCompose,
      },
      CreateServerDockerComposeDev: {
        before: this.beforeCreateServerDockerComposeDev,
      },
      CreateServerAuth: {
        before: this.beforeCreateAuthModules,
        after: this.afterCreateAuthModules,
      },
    };
  }

  beforeCreateAdminModules(
    context: DsgContext,
    eventParams: CreateAdminUIParams,
  ) {
    if (context.resourceInfo) {
      context.resourceInfo.settings.authProvider = EnumAuthProviderType.Http;
    }

    return eventParams;
  }

  beforeCreateAuthModules(
    context: DsgContext,
    eventParams: CreateServerAuthParams,
  ) {
    context.utils.skipDefaultBehavior = true;
    return eventParams;
  }

  async afterCreateAuthModules(
    context: DsgContext,
    eventParams: CreateServerAuthParams,
    modules: ModuleMap,
  ): Promise<ModuleMap> {
    const staticPath = resolve(__dirname, "./static");

    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.srcDirectory,
    );

    // 1. Create Keycloak strategy
    const keycloakStrategy = await createKeycloakStrategy(context);
    modules.set(keycloakStrategy);

    // 2. Create Keycloak strategy base
    const keycloakStrategyBase = await createKeycloakStrategyBase(context);
    modules.set(keycloakStrategyBase);

    // 3. Create auth module
    const authModule = await createAuthModule(context);
    modules.set(authModule);

    // 4. Create auth resolver
    const authResolver = await createAuthResolver(context);
    modules.set(authResolver);

    await modules.merge(staticsFiles);

    // Remove the default auth modules
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
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams,
  ) {
    const {
      KEYCLOAK_HOST,
      KEYCLOAK_REALM,
      KEYCLOAK_CLIENT_ID,
      KEYCLOAK_CLIENT_SECRET,
      KEYCLOAK_CALLBACK_URL,
    } = getPluginSettings(context.pluginInstallations);

    eventParams.envVariables = [
      ...eventParams.envVariables,
      ...[
        { KEYCLOAK_HOST },
        { KEYCLOAK_REALM },
        { KEYCLOAK_CLIENT_ID },
        { KEYCLOAK_CLIENT_SECRET },
        { KEYCLOAK_CALLBACK_URL },
      ],
    ];

    return eventParams;
  }

  beforeCreateServerDockerCompose(
    context: DsgContext,
    eventParams: CreateServerDockerComposeParams,
  ) {
    eventParams.updateProperties.push(...updateDockerComposeProperties);
    return eventParams;
  }

  beforeCreateServerDockerComposeDev(
    context: DsgContext,
    eventParams: CreateServerDockerComposeDBParams,
  ) {
    eventParams.updateProperties.push(...updateDockerComposeDevProperties);
    return eventParams;
  }
}

export default KeycloakAuthPlugin;
