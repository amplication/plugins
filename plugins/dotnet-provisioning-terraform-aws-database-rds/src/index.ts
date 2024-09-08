import {
  dotnetPluginEventsTypes,
  dotnetPluginEventsParams as dotnet,
  dotnetTypes,
  FileMap,
  IFile,
} from "@amplication/code-gen-types";
import { CodeBlock } from "@amplication/csharp-ast";
import {
  moduleNameRdsKey,
  moduleNameSgKey,
  pgAllocatedStorageKey,
  pgDatabaseIdentifierKey,
  pgDatabaseNameKey,
  pgDatabasePortKey,
  pgDatabaseUsernameKey,
  pgMaintenanceWindowKey,
  pgMaximumStorageKey,
  pgBackupWindowKey,
  pgBackupRetentionPeriodKey,
  pgSgIdentifierKey,
  pgDatabaseInstanceClassKey,
} from "./constants";
import { getPluginSettings, getTerraformDirectory } from "./utils";
import { resolve } from "path";
import { camelCase, kebabCase, snakeCase } from "lodash";
import { isPostgresSettings } from "./types";

class TerraformAwsDatabaseRdsPlugin implements dotnetTypes.AmplicationPlugin {
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
    context.logger.info(`Generating Terraform AWS Database RDS...`);

    // get the name for the service, to be used as a fallback for the
    // repository name
    const serviceName = kebabCase(context.resourceInfo?.name);
    if (!serviceName) {
      throw new Error(
        "TerraformAwsRepositoryEcrPlugin: Service name is undefined"
      );
    }

    // instantiate a variable consisting of the path on the
    // 'provisioning-terraform-aws-core' made up of the settings
    // 'root_directory' & 'directory_name', this function will throw
    // an error if the aforementioned plugin wasnt installed.
    const terraformDirectory = getTerraformDirectory(
      context.pluginInstallations,
      context.serverDirectories.baseDirectory
    );

    // import the settings, which are merged default settings & user inputs
    const settings = getPluginSettings(context.pluginInstallations);

    const underscoreName: string = snakeCase(serviceName);
    const hyphenName: string = kebabCase(serviceName);

    const templateFileName = "rds-template.tf";
    const fileNamePrefix = "rds-";
    const fileNameSuffix = ".tf";

    // default database type to postgres, when new
    // database types are added the template for these
    // can be fetched seperately below.
    let staticPath: string;
    let databaseIdentifier: string;
    let databaseName: string;
    let securityGroupName: string;

    if (isPostgresSettings(settings)) {
      staticPath = resolve(__dirname, "./static/postgres");
      databaseIdentifier = settings.postgres.identifier
        ? settings.postgres.identifier
        : hyphenName;
      databaseName = settings.postgres.database_name
        ? settings.postgres.database_name
        : hyphenName;
      securityGroupName = settings.postgres.security_group.name
        ? settings.postgres.security_group.name
        : hyphenName;
    } else {
      throw new Error(
        "TerraformAwsDatabaseRdsPlugin: is dependent on 'Terraform - AWS Core' plugin"
      );
    }

    const staticFiles = await context.utils.importStaticFiles(
      staticPath,
      terraformDirectory
    );

    if (isPostgresSettings(settings)) {
      for (const item of staticFiles.getAll()) {
        const newCode = item.code
          .replaceAll(moduleNameRdsKey, "rds_" + underscoreName)
          .replaceAll(moduleNameSgKey, "sg_" + underscoreName)
          .replaceAll(pgDatabaseIdentifierKey, databaseIdentifier)
          .replaceAll(
            pgAllocatedStorageKey,
            String(settings.postgres.storage.allocated)
          )
          .replaceAll(
            pgMaximumStorageKey,
            String(settings.postgres.storage.maximum)
          )
          .replaceAll(pgDatabaseNameKey, camelCase(databaseName))
          .replaceAll(pgDatabaseUsernameKey, settings.postgres.username)
          .replaceAll(pgDatabasePortKey, String(settings.postgres.port))
          .replaceAll(
            pgDatabaseInstanceClassKey,
            settings.postgres.instance_class
          )
          .replaceAll(
            pgMaintenanceWindowKey,
            settings.postgres.maintenance.window
          )
          .replaceAll(pgBackupWindowKey, settings.postgres.backup.window)
          .replaceAll(
            pgBackupRetentionPeriodKey,
            String(settings.postgres.backup.retention_period)
          )
          .replaceAll(pgSgIdentifierKey, "rds-" + securityGroupName);
        const newPath = item.path.replace(
          templateFileName,
          fileNamePrefix + hyphenName + fileNameSuffix
        );
        
        const file: IFile<CodeBlock> = {
          path: newPath,
          code: new CodeBlock({
            code: newCode,
          }),
        };
        files.set(file);
      }
    } else {
      throw new Error(
        "TerraformAwsDatabaseRdsPlugin: is dependent on 'Terraform - AWS Core' plugin"
      );
    }

    context.logger.info(`Generated Terraform AWS Database RDS...`);

    return files;
  }
}

export default TerraformAwsDatabaseRdsPlugin;
