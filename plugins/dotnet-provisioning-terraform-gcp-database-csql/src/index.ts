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
import {
  environmentKey,
  nameKey,
  regionKey,
  moduleNameKey,
  zoneSuffixKey,
  tierKey,
  databaseCharsetKey,
  databaseCollationKey,
  diskSizeKey,
  diskTypekey,
  availabilityTypeKey,
  deletionProtectionKey,
  versionKey,
  teamKey,
} from "./constants";

class TerraformAwsDatabaseCloudSql implements dotnetTypes.AmplicationPlugin {
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
    context.logger.info(`Generating Terraform GCP Database Cloud SQL...`);

    // get the name for the service, to be used as a fallback for the
    // repository name
    const serviceName = kebabCase(context.resourceInfo?.name);
    if (!serviceName) {
      throw new Error(
        "TerraformAwsDatabaseCloudSql: Service name is undefined"
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

    const templateFileName = "csql-template.tf";
    const fileNamePrefix = "csql-";
    const fileNameSuffix = ".tf";
    const name: string = settings.global.name
      ? settings.global.name
      : serviceName;

    const staticPath = resolve(
      __dirname,
      "./static/" + settings.configuration.type
    );

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
        .replaceAll(nameKey, kebabCase(name))
        .replaceAll(moduleNameKey, "csql_" + snakeCase(name))
        .replaceAll(environmentKey, settings.global.environment)
        .replaceAll(teamKey, settings.global.team)
        .replaceAll(regionKey, settings.global.region)
        .replaceAll(zoneSuffixKey, settings.global.zone_suffix)
        .replaceAll(tierKey, settings.global.tier)
        .replaceAll(databaseCharsetKey, settings.global.charset)
        .replaceAll(databaseCollationKey, settings.global.collation)
        .replaceAll(diskSizeKey, settings.global.disk_size)
        .replaceAll(diskTypekey, settings.global.disk_type)
        .replaceAll(availabilityTypeKey, settings.global.availability_type)
        .replaceAll(deletionProtectionKey, settings.global.deletion_protection)
        .replaceAll(versionKey, settings.global.version);
      const file: IFile<CodeBlock> = {
        path: newPath,
        code: new CodeBlock({
          code: newCode,
        }),
      };
      modules.set(file);
    }

    context.logger.info(`Generated Terraform GCP Database Cloud SQL...`);
    return modules;
  }
}

export default TerraformAwsDatabaseCloudSql;
