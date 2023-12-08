import type {
  AmplicationPlugin,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { join } from "node:path";
import { EventNames } from "@amplication/code-gen-types";
import { resolve } from "path";
import { getPluginSettings } from "./utils";
import { kebabCase } from "lodash";
import { BackendTypes } from "./types";
import {
  backendKey,
  environmentsKey,
  globalOrganisationIdKey,
  globalBillingAccountKey,
  globalBillingProjectKey,
  globalDomainKey,
  globalRegionPrefixKey,
} from "./constants";

class TerraformGcpCorePlugin implements AmplicationPlugin {
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
    context.logger.info("Generating Terraform Google Cloud Platform Core ...");

    // determine the name of the service which will be used as the name for the workflow
    // workflow names must be lower case letters and numbers. words may be separated with dashes (-):
    const serviceName = kebabCase(context.resourceInfo?.name);

    if (!serviceName) {
      throw new Error("Service name is undefined");
    }

    // fetch the plugin specific settings and merge them with the defaults
    const settings = getPluginSettings(context.pluginInstallations);

    /**
     * save the renderedOutput to the desired directory the options are on the root of the repository
     * and within the directory of the services itself setting "root_directory":
     *
     *    option 1 (value: true):  /<directory_name_value>/<directory_name_value>
     *    option 2 (value: false): /[optional: mono_prefix]/<service_name>/<directory_name_value>
     */

    const rootDirectoryPath: string = "./";
    const terraformDirectoryPath: string = settings.root_level
      ? join(rootDirectoryPath, settings.directory_name)
      : join(context.serverDirectories.baseDirectory, settings.directory_name);

    let backendConfiguration: string;

    switch (settings.backend.type) {
      case BackendTypes.Local:
        backendConfiguration = `terraform {
    backend "${BackendTypes.Local}" {
      path = "${settings.backend?.local?.path}"
    }
  }`;
        break;
      case BackendTypes.Gcs:
        backendConfiguration = `terraform {
    backend "${BackendTypes.Gcs}" {
      bucket = "${settings.backend?.gcs?.bucket}"
      prefix = "${settings.backend?.gcs?.prefix}"
    }
  }`;
        break;
    }

    let environmentsConfiguration: string;

    if (Object.keys(settings.environments).length > 0) {
      environmentsConfiguration = JSON.stringify(
        settings.environments,
        null,
        "\t"
      );
    } else {
      context.logger.warn(
        "TerraformGcpCorePlugin: no environments were passed..."
      );
      environmentsConfiguration = "{}";
    }

    // set the path to the static files and fetch them for manipulation
    const staticPath = resolve(__dirname, "./static");
    const staticFiles = await context.utils.importStaticModules(
      staticPath,
      terraformDirectoryPath
    );

    staticFiles.replaceModulesCode((_path, code) =>
      code
        .replaceAll(globalOrganisationIdKey, settings.global.organization_id)
        .replaceAll(globalBillingAccountKey, settings.global.billing_account)
        .replaceAll(globalBillingProjectKey, settings.global.billing_project)
        .replaceAll(globalDomainKey, settings.global.domain)
        .replaceAll(globalRegionPrefixKey, settings.global.region_prefix)
        .replaceAll(environmentsKey, environmentsConfiguration)
        .replaceAll(backendKey, backendConfiguration)
    );

    context.logger.info("Generated Terraform Google Cloud Platform Core ...");

    await modules.merge(staticFiles);
    return modules;
  }
}

export default TerraformGcpCorePlugin;
