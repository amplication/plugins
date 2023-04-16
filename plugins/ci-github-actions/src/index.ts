import type {
  AmplicationPlugin,
  CreateServerParams,
  DsgContext,
  Events,
  Module,
} from "@amplication/code-gen-types";
import {
  imageNameKey,
  registryKey,
  serverWorkingDirectoryKey,
  serviceNameKey,
} from "./constants";
import { getPluginSettings } from "./utils";
import { EventNames } from "@amplication/code-gen-types";
import { resolve } from "path";

class GithubActionsPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServer]: {
        after: this.afterCreateServer,
      },
    };
  }

  async afterCreateServer(
    context: DsgContext,
    eventParams: CreateServerParams,
    modules: Module[]
  ) {
    context.logger.info(`Generating Github Actions workflow...`);

    // determine the name of the service which will be used as the name for the workflow
    // workflow names must be lower case letters and numbers. words may be separated with dashes (-):
    const serviceName = context.resourceInfo?.name
      .toLocaleLowerCase()
      .replaceAll(/[^a-zA-Z0-9-]/g, "-");

    if (!serviceName) {
      throw new Error("Service name is undefined");
    }

    // getPluginSettings: fetch user settings + merge with default settings
    const settings = getPluginSettings(context.pluginInstallations);

    /**
     * option 1 (settings.include_containerization_steps == true)
     *    when the include_publish_step is set to true, the steps
     *    for setting up the metadata, logging in to the container
     *    repostiory and build an publishing the image are included
     *
     * option 2 (settings.include_containerization_steps == false):
     *    when the include_publish_step is set to false, the steps
     *    for setting up the metadata, logging in to the container
     *    repostiory and build an publishing the image arent included
     */

    let renderdOutput;
    let staticPath;
    let staticFiles;

    if (settings.include_containerization_steps == true) {
      staticPath = resolve(__dirname, "./static/publish/");
      staticFiles = await context.utils.importStaticModules(
        staticPath,
        "./.github/workflows/"
      );

      const imageName = settings.registry_configuration?.registry_path
        ? settings.registry_configuration?.registry +
          "/" +
          settings.registry_configuration?.registry_path +
          "/" +
          settings.registry_configuration?.image_name
        : settings.registry_configuration?.registry +
          "/" +
          settings.registry_configuration?.image_name;

      renderdOutput = staticFiles.map(
        (file): Module => ({
          path: file.path.replace(
            "workflow.yaml",
            "ci-" + serviceName + ".yaml"
          ),
          code: file.code
            .replaceAll(serviceNameKey, serviceName)
            .replaceAll(imageNameKey, imageName)
            .replaceAll(registryKey, settings.registry_configuration?.registry!)
            .replaceAll(
              serverWorkingDirectoryKey,
              context.serverDirectories.baseDirectory
            ),
        })
      );

      return [...modules, ...renderdOutput];
    } else {
      staticPath = resolve(__dirname, "./static/default/");
      staticFiles = await context.utils.importStaticModules(
        staticPath,
        "./.github/workflows/"
      );

      renderdOutput = staticFiles.map(
        (file): Module => ({
          path: file.path.replace(
            "workflow.yaml",
            "ci-" + serviceName + ".yaml"
          ),
          code: file.code.replaceAll(serviceNameKey, serviceName),
        })
      );

      return [...modules, ...renderdOutput];
    }
  }
}

export default GithubActionsPlugin;
