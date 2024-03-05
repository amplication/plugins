import type {
  AmplicationPlugin,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { resolve } from "path";
import { kebabCase, snakeCase } from "lodash";
import { getTerraformDirectory, getPluginSettings } from "./utils";
import { moduleNameKey, nameKey, regionKey } from "./constants";

class TerraformGcpRepositoryArPlugin implements AmplicationPlugin {
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
    const staticFiles = await context.utils.importStaticModules(
      staticPath,
      terraformDirectory
    );

    staticFiles.replaceModulesPath((path) =>
      path.replace(templateFileName, fileNamePrefix + name + fileNameSuffix)
    );

    staticFiles.replaceModulesCode((_path, code) =>
      code
        .replaceAll(moduleNameKey, "ar_" + snakeCase(name))
        .replaceAll(nameKey, kebabCase(name))
        .replaceAll(regionKey, settings.region)
    );

    context.logger.info(
      `Generated Terraform GCP Repository Artifact Registry...`
    );

    await modules.merge(staticFiles);
    return modules;
  }
}

export default TerraformGcpRepositoryArPlugin;
