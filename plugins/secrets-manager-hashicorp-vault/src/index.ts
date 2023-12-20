import {
  EventNames,
  type AmplicationPlugin,
  type CreateServerPackageJsonParams,
  type DsgContext,
  type Events,
  CreateServerDotEnvParams,
  CreateServerParams,
  ModuleMap,
  CreateServerSecretsManagerParams,
  CreateServerDockerComposeParams,
  CreateServerDockerComposeDBParams,
} from "@amplication/code-gen-types";
import {
  authModeAppRole,
  authModeToken,
  configs,
  dependencies,
  envVariablesAppRole,
  envVariablesAuthToken,
  updateDockerComposeDevProperties,
  updateDockerComposeProperties,
} from "./constants";
import { join, resolve } from "path";
import { getPluginSettings } from "./utils";
import { secretNamesParser } from "./utils/secret_name_parser";
import { readFile, print } from "@amplication/code-gen-utils";
import { interpolate } from "./utils/ast";

class HashiCorpVaultPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServerPackageJson]: {
        before: this.beforeCreatePackageJson,
      },
      [EventNames.CreateServerDotEnv]: {
        before: this.beforeCreateServerDotEnv,
      },
      [EventNames.CreateServer]: {
        after: this.beforeCreateServer,
      },
      [EventNames.CreateServerSecretsManager]: {
        before: this.beforeCreateServerSecretsManager,
      },
      [EventNames.CreateServerDockerCompose]: {
        before: this.beforeCreateServerDockerCompose,
      },
      [EventNames.CreateServerDockerComposeDev]: {
        before: this.beforeCreateServerDockerComposeDev,
      },
    };
  }

  beforeCreatePackageJson(
    _: DsgContext,
    eventParams: CreateServerPackageJsonParams,
  ): CreateServerPackageJsonParams {
    eventParams.updateProperties.push(dependencies);

    return eventParams;
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams,
  ): CreateServerDotEnvParams {
    const { authMode } = getPluginSettings(context.pluginInstallations);

    if (authMode == "APPROLE") {
      eventParams.envVariables = [
        ...eventParams.envVariables,
        ...envVariablesAppRole,
      ];
    } else {
      eventParams.envVariables = [
        ...eventParams.envVariables,
        ...envVariablesAuthToken,
      ];
    }

    return eventParams;
  }

  async beforeCreateServer(
    context: DsgContext,
    _: CreateServerParams,
    modules: ModuleMap,
  ): Promise<ModuleMap> {
    const { fetchMode, authMode } = getPluginSettings(
      context.pluginInstallations,
    );
    const staticPath = resolve(__dirname, "static", fetchMode.toLowerCase());

    // Gen code for the provider based on the auth type selected
    const template = await readFile(
      resolve(
        __dirname,
        "templates",
        fetchMode.toLowerCase(),
        "secretsManager.provider.ts",
      ),
    );

    interpolate(template, {
      //@ts-expect-error VAULT_AUTH will be replaced by the interpolation
      VAULT_AUTH: authMode == "APPROLE" ? authModeAppRole : authModeToken,
    });

    await modules.set({
      code: print(template).code,
      path: join(
        context.serverDirectories.srcDirectory,
        "providers",
        "secrets",
        "secretsManager.provider.ts",
      ),
    });

    // Import static files
    const staticFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.srcDirectory,
    );

    await modules.merge(staticFiles);

    // Copy the config files
    const configFiles = await context.utils.importStaticModules(
      configs,
      context.serverDirectories.baseDirectory,
    );

    await modules.merge(configFiles);

    return modules;
  }

  beforeCreateServerDockerCompose(
    _: DsgContext,
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

  async beforeCreateServerSecretsManager(
    context: DsgContext,
    eventParams: CreateServerSecretsManagerParams,
  ): Promise<CreateServerSecretsManagerParams> {
    const { secretNames } = getPluginSettings(context.pluginInstallations);

    eventParams.secretsNameKey.push(...secretNamesParser(secretNames));

    return eventParams;
  }
}

export default HashiCorpVaultPlugin;
