import {
  dotnetPluginEventsTypes,
  dotnetPluginEventsParams as dotnet,
  dotnetTypes,
  FileMap,
  IFile,
} from "@amplication/code-gen-types";
import { CodeBlock } from "@amplication/csharp-ast";
import { resolve } from "path";
import { kebabCase, snakeCase } from "lodash";
import { getTerraformDirectory, getPluginSettings } from "./utils";
import { moduleNameKey, nameKey, regionKey } from "./constants";

class TerraformGcpRepositoryArPlugin implements dotnetTypes.AmplicationPlugin {
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
    modules: FileMap<CodeBlock>
  ): Promise<FileMap<CodeBlock>> {
    context.logger.info(
      `Generating Terraform GCP Repository Artifact Registry...`
    );

    // get the name for the service, to be used as a fallback for the
    // repository name
    const serviceName = kebabCase(context.resourceInfo?.name);
    if (!serviceName) {
      throw new Error(
        "TerraformAwsRepositoryEcrPlugin: Service name is undefined"
      );
    }

    // instantiate a variable consisting of the path on the
    // 'provisioning-terraform-gcp-core' made up of the settings
    // 'root_directory' & 'directory_name', this function will throw
    // an error if the aforementioned plugin wasnt installed.
    const terraformDirectory = getTerraformDirectory(
      context.pluginInstallations,
      context.serverDirectories.baseDirectory
    );

    // fetch the plugin specific settings and merge them with the defaults
    const settings = getPluginSettings(context.pluginInstallations);

    const templateFileName = "ar-template.tf";
    const fileNamePrefix = "ar-";
    const fileNameSuffix = ".tf";
    const name: string = settings.repository_name
      ? settings.repository_name
      : serviceName;

    const staticPath = resolve(__dirname, "./static");
    const staticFiles = await context.utils.importStaticFiles(
      staticPath,
      terraformDirectory
    );

    for (const item of staticFiles.getAll()) {
      const newPath = item.path.replace(
        templateFileName,
        fileNamePrefix + name + fileNameSuffix
      );
      const newCode = item.code
        .replaceAll(moduleNameKey, "ar_" + snakeCase(name))
        .replaceAll(nameKey, kebabCase(name))
        .replaceAll(regionKey, settings.region);
      const file: IFile<CodeBlock> = {
        path: newPath,
        code: new CodeBlock({
          code: newCode,
        }),
      };
      modules.set(file);
    }

    context.logger.info(
      `Generated Terraform GCP Repository Artifact Registry...`
    );

    return modules;
  }
}

export default TerraformGcpRepositoryArPlugin;
