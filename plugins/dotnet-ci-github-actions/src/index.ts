import {
  dotnetPluginEventsTypes,
  dotnetPluginEventsParams as dotnet,
  dotnetTypes,
  FileMap,
  IFile,
} from "@amplication/code-gen-types";
import { CodeBlock } from "@amplication/csharp-ast";
import {
  authenticationPasswordKey,
  authenticationUsernameKey,
  imageKey,
  serviceWorkingDirectoryKey,
  serviceNameKey,
} from "./constants";
import { getPluginSettings } from "./utils";
import { resolve } from "path";
import { kebabCase } from "lodash";
import { GitHubAuthenticationMethods, RegistryProviders } from "./types";

class GithubActionsPlugin implements dotnetTypes.AmplicationPlugin {
  register(): dotnetPluginEventsTypes.DotnetEvents {
    return {
      LoadStaticFiles: {
        after: this.afterLoadStaticFiles,
      },
    };
  }

  async afterLoadStaticFiles(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.LoadStaticFilesParams,
    files: FileMap<CodeBlock>
  ): Promise<FileMap<CodeBlock>> {
    context.logger.info(`Generating GitHub Actions workflow...`);

    // determine the name of the service which will be used as the name for the workflow
    // workflow names must be lower case letters and numbers. words may be separated with dashes (-):
    const serviceName = kebabCase(context.resourceInfo?.name);

    if (!serviceName) {
      throw new Error("Service name is undefined");
    }

    // getPluginSettings: fetch user settings + merge with default settings
    const settings = getPluginSettings(context.pluginInstallations);

    /**
     * option 1 '} else {' (settings.registry == "")
     *    when the registry setting is left empty - or doesnt equat to
     *    on of the RegistryProviders.<...>, the steps for setting up
     *    the metadata, logging in to the container repostiory and build
     *    and publishing the image arent included
     *
     * option 2 'specific provider' (settings.registry == registryProvider.Github || registryProvider.<...>):
     *    when the registry setting is provided with a supported provider, the steps
     *    for setting up the metadata, logging in to the container
     *    repostiory and build an publishing the image are included
     */

    const templateFileName = "workflow.yaml";
    const workflowFileNamePrefix = "ci-";
    const workflowFileNameSuffix = ".yaml";
    const outputDirectory = "./.github/workflows/";

    const successfulPluginCodeGeneration =
      "Generated GitHub Actions workflow...";
    const staticFilesRevised = new FileMap<CodeBlock>(context.logger);

    if (settings.registry == RegistryProviders.GitHub) {
      const githubStaticFiles = "./static/github/";

      const staticPath = resolve(__dirname, githubStaticFiles);
      const staticFiles = await context.utils.importStaticFiles(
        staticPath,
        outputDirectory
      );

      // set the registry to the github packages registry url and
      // define the image name so that the image can be pushed to the
      // github packages of the users profile or organization if specfied
      // in the registry_path instead.
      const registryUrl = "ghcr.io";
      const image = settings.configuration?.registry_path
        ? `${registryUrl}/${settings.configuration?.registry_path}/${serviceName}`
        : `${registryUrl}/\${{ github.actor }}/${serviceName}`;

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
        settings.configuration?.authentication_method ==
        GitHubAuthenticationMethods.PersonalAccessToken
          ? "${{ secrets.GITHUB_PACKAGES_PAT }}"
          : "${{ secrets.GITHUB_TOKEN }}";

      for (const item of staticFiles.getAll()) {
        const newPath = item.path.replace(
          templateFileName,
          workflowFileNamePrefix + serviceName + workflowFileNameSuffix
        );
        const newCode = item.code
          .replaceAll(serviceNameKey, serviceName)
          .replaceAll(imageKey, image)
          .replaceAll(authenticationUsernameKey, authenticationUsername)
          .replaceAll(authenticationPasswordKey, authenticationPassword)
          .replaceAll(
            serviceWorkingDirectoryKey,
            context.serverDirectories.baseDirectory
          );

        const file: IFile<CodeBlock> = {
          path: newPath,
          code: new CodeBlock({
            code: newCode,
          }),
        };
        staticFilesRevised.set(file);
      }
    } else {
      const defaultStaticFiles = "./static/default/";

      const staticPath = resolve(__dirname, defaultStaticFiles);
      const staticFiles = await context.utils.importStaticFiles(
        staticPath,
        outputDirectory
      );
      for (const item of staticFiles.getAll()) {
        const newPath = item.path.replace(
          templateFileName,
          workflowFileNamePrefix + serviceName + workflowFileNameSuffix
        );
        const newCode = item.code
          .replaceAll(serviceNameKey, serviceName)
          .replaceAll(
            serviceWorkingDirectoryKey,
            context.serverDirectories.baseDirectory
          );

        const file: IFile<CodeBlock> = {
          path: newPath,
          code: new CodeBlock({
            code: newCode,
          }),
        };

        staticFilesRevised.set(file);
      }
    }
    context.logger.info(successfulPluginCodeGeneration);
    await files.merge(staticFilesRevised);
    return files;
  }
}

export default GithubActionsPlugin;
