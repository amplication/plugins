import type {
  AmplicationPlugin,
  CreateAdminUIParams,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { getPluginSettings } from "./utils";
import genDevcontainerConfig from "./utils/genDevcontainerConfig"
import genDevcontainerConfigWithAdminUI from "./utils/genDevcontainerConfigWithAdminUI"
import patchNginx from "./utils/patchNginx"
import path, { join } from "path"
import fs from "fs"
import { Context } from "vm";
import genPathBasedOnConfig from "./utils/genPathBasedOnConfig"

class GithubCodespacesPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServer]: {
        after: this.afterCreateServer,
      },
      [EventNames.CreateAdminUI]: {
        after: this.afterCreateAdminUI
      },
    };
  }

  async afterCreateServer(
    context: DsgContext,
    eventParams: CreateServerParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const settings = getPluginSettings(context.pluginInstallations);
    const serviceName = context.resourceInfo?.name ?? "Amplication App"
    const devContainerPath = genPathBasedOnConfig(settings, serviceName)

    // Get dev container config
    let containerConfig;
    if (!settings.includeAdminUI) {
      containerConfig = genDevcontainerConfig(serviceName, context.serverDirectories.baseDirectory)
    } else {
      containerConfig = genDevcontainerConfigWithAdminUI(serviceName, context.serverDirectories.baseDirectory, context.clientDirectories.baseDirectory)
    }

    const envConfig = fs.readFileSync(join(__dirname, "templates", "init.sh"), { encoding: "utf-8" })
      .replace("{SERVER_ROOT}", context.serverDirectories.baseDirectory)

    // Merge code
    await modules.set({
      code: JSON.stringify(containerConfig, null, 2),
      path: devContainerPath
    })

    await modules.set({
      code: envConfig,
      path: join(path.dirname(devContainerPath), "init.sh")
    })

    return modules
  }

  async afterCreateAdminUI(
    context: Context,
    eventParams: CreateAdminUIParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const settings = getPluginSettings(context.pluginInstallations)

    if (!settings.includeAdminUI) return modules

    const nginxPath = join(context.clientDirectories.baseDirectory, "configuration", "nginx.conf")
    const dockerComposePath = join(context.clientDirectories.baseDirectory, "docker-compose.yml")

    // Get nginx config and patch it to change the listen address
    const patchedNginx = patchNginx(modules.get(nginxPath).code)

    // Override the original nginx with the patched version
    await modules.set({
      path: nginxPath,
      code: patchedNginx,
    })

    // Add docker compose
    await modules.set({
      path: dockerComposePath,
      code: fs.readFileSync(join(__dirname, "static", "admin.docker-compose.yml"), { encoding: "utf-8" })
    })

    return modules
  }
}

export default GithubCodespacesPlugin;
