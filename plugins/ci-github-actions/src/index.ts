import type {
  AmplicationPlugin,
  CreateServerParams,
  DsgContext,
  Events,
  Module,
} from "@amplication/code-gen-types";
import {
  authenticationPasswordKey,
  authenticationUsernameKey,
  imageKey,
  serviceWorkingDirectoryKey,
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
     * option 1 '} else {' (settings.registry == "")
     *    when the registry setting is left empty, the steps
     *    for setting up the metadata, logging in to the container
     *    repostiory and build an publishing the image arent included
     *
     * option 2 'specific provider' (settings.registry == registryProvider.Github || registryProvider.<...>):
     *    when the registry setting is provided with a supported provider, the steps
     *    for setting up the metadata, logging in to the container
     *    repostiory and build an publishing the image are included
     */

    let renderdOutput;
    let staticPath;
    let staticFiles;

    let registry: string;
    let image: string;

    if (settings.registry == "github") {
      staticPath = resolve(__dirname, "./static/github/");
      staticFiles = await context.utils.importStaticModules(
        staticPath,
        "./.github/workflows/"
      );

      // set the registry to the github packages registry url and
      // define the image name so that the image can be pushed to the
      // github packages of the users profile or organization if specfied
      // in the registry_path instead.
      registry = "ghcr.io";
      image = settings.configuration?.registry_path
        ? `${registry}/${settings.configuration?.registry_path}/${serviceName}`
        : `${registry}/\${{ github.actor }}/${serviceName}`;

      // split the registry path so that the first part can be used to determine
      // to what registry the push the container images to - i.e., personal profile
      // or organization.
      const authenticationUsername = settings.configuration?.registry_path
        ? settings.configuration?.registry_path?.split("/")[0]
        : "${{ github.actor }}";

      // if the authenticaiton method is set to pat (personal access token), specify
      // the key for a secret within the secrets of the repository otherwise the
      // default github token is used for authentication to the github packages container
      // registry.
      const authenticationPassword =
        settings.configuration?.authentication_method == "pat"
          ? "${{ secrets.GITHUB_PACKAGES_PAT }}"
          : "${{ secrets.GITHUB_TOKEN }}";

      renderdOutput = staticFiles.map(
        (file): Module => ({
          path: file.path.replace(
            "workflow.yaml",
            "ci-" + serviceName + ".yaml"
          ),
          code: file.code
            .replaceAll(serviceNameKey, serviceName)
            .replaceAll(imageKey, image)
            .replaceAll(authenticationUsernameKey, authenticationUsername)
            .replaceAll(authenticationPasswordKey, authenticationPassword)
            .replaceAll(
              serviceWorkingDirectoryKey,
              context.serverDirectories.baseDirectory
            ),
        })
      );

      context.logger.info(`Generated Github Actions workflow...`);
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
          code: file.code
            .replaceAll(serviceNameKey, serviceName)
            .replaceAll(
              serviceWorkingDirectoryKey,
              context.serverDirectories.baseDirectory
            ),
        })
      );

      context.logger.info(`Generated Github Actions workflow...`);
      return [...modules, ...renderdOutput];
    }
  }
}

export default GithubActionsPlugin;
