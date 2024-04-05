import type {
  AmplicationPlugin,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import YAML from "yaml"
import { genDevcontainerDockerComposeForServer, genDevcontainerDockerComposeForServerAndAdminUI } from "./utils/genDockerCompose"
import { genDevcontainerConfig, genDevcontainerConfigForAdminUI } from "./utils/genDevcontainer"
import getDevcontainerFolder from "./utils/getDevcontainerFolder"
import { getPluginSettings } from "./utils"
import { join } from "path"
import fs from "fs"

const DEFAULT_SERVICE_NAME = "Amplication App"

class GithubCode implements AmplicationPlugin {
  /**
   * This is mandatory function that returns an object with the event name. Each event can have before or/and after
   */
  register(): Events {
    return {
      [EventNames.CreateServer]: {
        after: this.afterCreateServer
      },
      [EventNames.CreateAdminUI]: {
        after: this.afterCreateAdminUI
      }
    };
  }

  async afterCreateAdminUI(
    context: DsgContext,
    eventParams: CreateServerParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const settings = getPluginSettings(context.pluginInstallations);

    if(settings.includeAdminUI) {
      const serviceName = context.resourceInfo?.name ?? DEFAULT_SERVICE_NAME;
      const devcontainerFolder = getDevcontainerFolder(settings, serviceName);

      const dockerCompose = genDevcontainerDockerComposeForServerAndAdminUI(devcontainerFolder, context.serverDirectories.baseDirectory, context.clientDirectories.baseDirectory);
      const adminUIDockerCompose = fs.readFileSync(join(__dirname, "static", "admin-ui.docker-compose.devcontainer.yml"), { encoding: "utf-8" })
      const devcontainerConfig = genDevcontainerConfigForAdminUI(serviceName)

      await modules.set({
        code: YAML.stringify(dockerCompose),
        path: join(devcontainerFolder, "docker-compose.devcontainer.yml")
      })

      await modules.set({
        code: JSON.stringify(devcontainerConfig, null, 2),
        path: join(devcontainerFolder, "devcontainer.json")
      })

      await modules.set({
        code: adminUIDockerCompose,
        path: join(context.clientDirectories.baseDirectory, "docker-compose.devcontainer.yml")
      })
    }

    return modules
  }

  async afterCreateServer(
    context: DsgContext,
    eventParams: CreateServerParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const settings = getPluginSettings(context.pluginInstallations);

    const serviceName = context.resourceInfo?.name ?? DEFAULT_SERVICE_NAME;
    const devcontainerFolder = getDevcontainerFolder(settings, serviceName);

    const dockerCompose = genDevcontainerDockerComposeForServer(devcontainerFolder, context.serverDirectories.baseDirectory);
    const devcontainer = genDevcontainerConfig(serviceName);

    await modules.set({
      code: JSON.stringify(devcontainer, null, 2),
      path: join(devcontainerFolder, "devcontainer.json")
    })

    await modules.set({
      code: YAML.stringify(dockerCompose),
      path: join(devcontainerFolder, "docker-compose.devcontainer.yml")
    })

    return modules
  }
}

export default GithubCode;
