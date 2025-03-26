import {
  dotnetPluginEventsTypes,
  dotnetPluginEventsParams as dotnet,
  dotnetTypes,
  FileMap,
  IFile,
} from "@amplication/code-gen-types";
import { CodeBlock } from "@amplication/csharp-ast";
import {
  nameKey,
  typeKey,
  moduleNameKey,
  configurationForceDeleteKey,
} from "./constants";
import { resolve } from "path";
import { getPluginSettings, getTerraformDirectory } from "./utils";
import { kebabCase, snakeCase } from "lodash";
import { RepositoryType } from "./types";
import { AmplicationPlugin } from "@amplication/code-gen-types/src/dotnet-plugins.types";

class TerraformAwsRepositoryEcrPlugin implements AmplicationPlugin {
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
    context.logger.info(`Generating Terraform AWS Repository ECR...`);

    // get the name for the service, to be used as a fallback for the
    // repository name
    const serviceName = kebabCase(context.resourceInfo?.name);
    if (!serviceName) {
      throw new Error("Service name is undefined");
    }

    // instantiate a variable consisting of the path on the
    // 'provisioning-terraform-aws-core' made up of the settings
    // 'root_directory' & 'directory_name', this function will throw
    // an error if the aforementioned plugin wasnt installed.
    const terraformDirectory = getTerraformDirectory(
      context.pluginInstallations,
      context.serverDirectories.baseDirectory
    );

    // fetch the plugin specific settings and merge them with the defaults
    const settings = getPluginSettings(context.pluginInstallations);

    if (
      settings.repository_type != RepositoryType.Private &&
      settings.repository_type != RepositoryType.Public
    ) {
      throw new Error(
        "TerraformAwsRepositoryEcrPlugin: The setting repository_type should either be 'private' or 'public'"
      );
    }

    const templateFileName = "ecr-template.tf";
    const fileNamePrefix = "ecr-";
    const fileNameSuffix = ".tf";
    const name: string = settings.repository_name
      ? settings.repository_name
      : serviceName;

    const staticPath = resolve(__dirname, "./static/");
    const chartTemplateFiles = await context.utils.importStaticFiles(
      staticPath,
      terraformDirectory
    );
    const fileMap = new FileMap<CodeBlock>(context.logger);
    for (const item of chartTemplateFiles.getAll()) {
      const newCode = item.code
      .replaceAll(moduleNameKey, "ecr_" + snakeCase(name))
      .replaceAll(nameKey, kebabCase(name))
      .replaceAll(typeKey, settings.repository_type)
      .replaceAll(
        configurationForceDeleteKey,
        String(settings.configuration.force_delete)
      );
    const file: IFile<CodeBlock> = {
      path: item.path.replace(templateFileName, fileNamePrefix + name + fileNameSuffix),
      code: new CodeBlock({
        code: newCode,
      }),
    };
    fileMap.set(file);
    }

    context.logger.info(`Generated Terraform AWS Repository ECR...`);
    await files.merge(fileMap);
    return files;
  }
}

export default TerraformAwsRepositoryEcrPlugin;
