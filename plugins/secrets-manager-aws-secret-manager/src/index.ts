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
} from "@amplication/code-gen-types";
import { dependencies, envVariables } from "./constants";
import { resolve } from "path";
import { getPluginSettings } from "./utils";
import { secretNamesParser } from "./utils/secret_name_parser";

class ExamplePlugin implements AmplicationPlugin {
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

  beforeCreatePackageJson(
    _: DsgContext,
    eventParams: CreateServerPackageJsonParams,
  ): CreateServerPackageJsonParams {
    eventParams.updateProperties.push(dependencies);

    return eventParams;
  }

  beforeCreateServerDotEnv(
    _: DsgContext,
    eventParams: CreateServerDotEnvParams,
  ): CreateServerDotEnvParams {
    eventParams.envVariables = [...eventParams.envVariables, ...envVariables];

    return eventParams;
  }

  async beforeCreateServer(
    context: DsgContext,
    _: CreateServerParams,
    modules: ModuleMap,
  ): Promise<ModuleMap> {
    const { fetchMode, secretNames } = getPluginSettings(
      context.pluginInstallations,
    );
    const staticPath = resolve(__dirname, "static", fetchMode.toLowerCase());

    // Import static files
    const staticFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.srcDirectory,
    );

    await modules.merge(staticFiles);

        // Dynamically generate Secrets.ts file if the fetch mode is STARTUP
        if(fetchMode == FetchMode.Startup) {
            await modules.set({
                code: genSecretsEnum(secretNamesParser(secretNames)),
                path: join(context.serverDirectories.srcDirectory, "providers", "secrets", "secrets.ts")
            })
        }

        return modules
    }
}

export default ExamplePlugin;
