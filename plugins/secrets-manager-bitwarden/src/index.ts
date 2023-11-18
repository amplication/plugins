import type {
  AmplicationPlugin,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
  CreateServerPackageJsonParams,
  CreateServerDotEnvParams,
  CreateServerSecretsManagerParams,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { resolve } from "path";
import { dependencies, envVariables } from "./constants";
import { getPluginSettings, secretNamesParser } from "./utils";

class BitWardenSecretsManagerPlugin implements AmplicationPlugin {
  /**
   * This is mandatory function that returns an object with the event name. Each event can have before or/and after
   */
  register(): Events {
    return {
      [EventNames.CreateServerPackageJson]: {
        before: this.beforeCreatePackageJson,
      },
      [EventNames.CreateServerDotEnv]: {
        before: this.beforeCreateServerDotEnv,
      },
      [EventNames.CreateServer]: {
        after: this.AfterCreateServer,
      },
      [EventNames.CreateServerSecretsManager]:{
        before: this.beforeCreateServerSecretsManager
      }
    };
  }
  // You can combine many events in one plugin in order to change the related files.
  beforeCreatePackageJson(_:DsgContext, eventParams: CreateServerPackageJsonParams)
  : CreateServerPackageJsonParams {
    eventParams.updateProperties.push(dependencies)
    return eventParams
  }

  beforeCreateServerDotEnv(_:DsgContext, eventParams: CreateServerDotEnvParams)
  : CreateServerDotEnvParams {
    eventParams.envVariables = [...eventParams.envVariables, ...envVariables]
    return eventParams
  }

  async AfterCreateServer(context: DsgContext, _: CreateServerParams, modules: ModuleMap)
  : Promise<ModuleMap> {
    const {fetchMode, secretNames} = getPluginSettings(context.pluginInstallations).settings
    const staticPath = resolve(__dirname, "static", fetchMode.toLowerCase())

    const staticFiles =  await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.srcDirectory
    )

    await modules.merge(staticFiles)

    return modules
  }
  async beforeCreateServerSecretsManager(context:DsgContext, eventParams:CreateServerSecretsManagerParams)
  : Promise<CreateServerSecretsManagerParams> {
    const {secretNames} = getPluginSettings(context.pluginInstallations).settings
    eventParams.secretsNameKey.push(...secretNamesParser(secretNames))
    return eventParams
  }
}

export default BitWardenSecretsManagerPlugin;
