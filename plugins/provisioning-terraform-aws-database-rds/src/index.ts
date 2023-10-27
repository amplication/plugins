import type {
  AmplicationPlugin,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
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
} from "./constants";
import { getPluginSettings, getTerraformDirectory } from "./utils";
import { EventNames } from "@amplication/code-gen-types";
import { resolve } from "path";
import { join, kebabCase, snakeCase } from "lodash";
import { DatabaseTypes } from "./types";

class TerraformAwsDatabaseRdsPlugin implements AmplicationPlugin {
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
    modules: ModuleMap
  ): Promise<ModuleMap> {
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

    const settings = getPluginSettings(context.pluginInstallations);

    const underscoreName: string = snakeCase(serviceName);
    const hyphenName: string = kebabCase(serviceName);

    const templateFileName: string = "rds-template.tf";
    const fileNamePrefix: string = "rds-";
    const fileNameSuffix: string = ".tf";

    // default database type to postgres, when new
    // database types are added the template for these
    // can be fetched seperately below.
    let staticPath: string;

    switch (settings.database.type) {
      default: {
        staticPath = resolve(__dirname, "./static/postgres");
      }
    }

    const staticFiles = await context.utils.importStaticModules(
      staticPath,
      terraformDirectory
    );

    staticFiles.replaceModulesPath((path) =>
      path.replace(
        templateFileName,
        fileNamePrefix + hyphenName + fileNameSuffix
      )
    );

    if (settings.database.type == DatabaseTypes.Postgres) {
      staticFiles.replaceModulesCode((code) =>
        code
          .replaceAll(moduleNameRdsKey, "rds_" + underscoreName)
          .replaceAll(moduleNameSgKey, "sg_" + underscoreName)
          .replaceAll(
            pgDatabaseIdentifierKey,
            settings.database.postgres?.identifier
          )
          .replaceAll(
            pgAllocatedStorageKey,
            String(settings.database.postgres?.storage?.allocated)
          )
          .replaceAll(
            pgMaximumStorageKey,
            String(settings.database.postgres?.storage.maximum)
          )
          .replaceAll(
            pgDatabaseNameKey,
            settings.database.postgres?.database_name
          )
          .replaceAll(
            pgDatabaseUsernameKey,
            settings.database.postgres?.username
          )
          .replaceAll(
            pgDatabasePortKey,
            String(settings.database.postgres?.port)
          )
          .replaceAll(
            pgMaintenanceWindowKey,
            settings.database.postgres?.maintainance?.window
          )
          .replaceAll(
            pgBackupWindowKey,
            settings.database.postgres?.backup.window
          )
          .replaceAll(
            pgBackupRetentionPeriodKey,
            String(settings.database.postgres?.backup.retention_period)
          )
          .replaceAll(
            pgSgIdentifierKey,
            join("-", "rds", settings.database.postgres?.security_group.name)
          )
      );
    } else {
      throw new Error(
        "TerraformAwsDatabaseRdsPlugin: is dependent on 'Terraform - AWS Core' plugin"
      );
    }

    context.logger.info(`Generated Terraform AWS Database RDS...`);

    await modules.merge(staticFiles);
    return modules;
  }
}

export default TerraformAwsDatabaseRdsPlugin;
