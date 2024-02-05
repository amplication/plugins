import type {
  AmplicationPlugin,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import {
  nameKey,
  typeKey,
  moduleNameKey,
  configurationForceDeleteKey,
} from "./constants";
import { EventNames } from "@amplication/code-gen-types";
import { resolve, join } from "path";
import { getPluginSettings, getTerraformDirectory } from "./utils";
import { kebabCase, snakeCase } from "lodash";
import { RepositoryType } from "./types";

class TerraformAwsRepositoryEcrPlugin implements AmplicationPlugin {
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
    context.logger.info(`Generating Terraform AWS Repository ECR...`);

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

    const templateFileName: string = "ecr-template.tf";
    const fileNamePrefix: string = "ecr-";
    const fileNameSuffix: string = ".tf";
    const name: string = settings.repository_name
      ? settings.repository_name
      : serviceName;

    const staticPath = resolve(__dirname, "./static/");
    const staticFiles = await context.utils.importStaticModules(
      staticPath,
      terraformDirectory
    );

    staticFiles.replaceModulesPath((path) =>
      path.replace(templateFileName, fileNamePrefix + name + fileNameSuffix)
    );

    staticFiles.replaceModulesCode((_path, code) =>
      code
        .replaceAll(moduleNameKey, "ecr_" + snakeCase(name))
        .replaceAll(nameKey, kebabCase(name))
        .replaceAll(typeKey, settings.repository_type)
        .replaceAll(
          configurationForceDeleteKey,
          String(settings.configuration.force_delete)
        )
    );

    context.logger.info(`Generated Terraform AWS Repository ECR...`);

    await modules.merge(staticFiles);
    return modules;
  }
}

export default TerraformAwsRepositoryEcrPlugin;
