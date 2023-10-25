import type {
  AmplicationPlugin,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import {
  nameKey,
  regionIdentifierKey,
  vpcCidrBlockKey,
  enableDnsHostnamesKey,
  enableDnsSupportKey,
  enableNatGatewayKey,
  singleNatGatewayKey,
  environmentKey,
  backendKey,
} from "./constants";
import { join } from "node:path";
import { getPluginSettings } from "./utils";
import { BackendTypes } from "./types";
import { EventNames } from "@amplication/code-gen-types";
import { resolve } from "path";
import { kebabCase } from "lodash";

class TerraformAwsCorePlugin implements AmplicationPlugin {
  /**
   * This is mandatory function that returns an object with the event name. Each event can have before or/and after
   */
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
    context.logger.info("Generating Terraform Amazon Web Services Core ...");

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
    const terraformDirectoryPath: string =
      settings.root_level ?
        join(rootDirectoryPath, settings.directory_name) :
        join(context.serverDirectories.baseDirectory, settings.directory_name)

    // define some configuration based on input/defaults
    const name: string =
      settings.global.name ? serviceName : settings.global.name;

    let backendConfiguration: string;

    switch (settings.backend.type) {
      case BackendTypes.Local:
        backendConfiguration = `terraform {\n\tbackend "local" {\n\t\tpath = "${settings.backend?.local?.path}"\n\t}\n}`;
      case BackendTypes.S3:
        backendConfiguration = `terraform {\n\tbackend "s3" {\n\t\tbucket = "${settings.backend?.s3?.bucket_name}"\n\t\tkey    = "${settings.backend?.s3?.key}"\n\t\tregion = "${settings.backend?.s3?.region}"\n\t}\n}`;
      default:
        throw new Error(
          "TerraformAwsCorePlugin: Specify a backend type and applicable subconfiguration"
        );
    }

    // set the path to the static files and fetch them for manipulation
    const staticPath = resolve(__dirname, "./static");
    const staticFiles = await context.utils.importStaticModules(
      staticPath,
      terraformDirectoryPath
    );

    staticFiles.replaceModulesCode((code) =>
      code
        .replaceAll(nameKey, name)
        .replaceAll(regionIdentifierKey, settings.global.region)
        .replaceAll(environmentKey, settings.global.environment)
        .replaceAll(vpcCidrBlockKey, settings.vpc.cidr_block)
        .replaceAll(
          enableDnsHostnamesKey,
          String(settings.vpc.enable_dns_hostnames)
        )
        .replaceAll(
          enableDnsSupportKey,
          String(settings.vpc.enable_dns_support)
        )
        .replaceAll(
          enableNatGatewayKey,
          String(settings.vpc.enable_nat_gateway)
        )
        .replaceAll(
          singleNatGatewayKey,
          String(settings.vpc.single_nat_gateway)
        )
        .replaceAll(backendKey, backendConfiguration)
    );

    context.logger.info("Generated Terraform Amazon Web Services Core ...");

    await modules.merge(staticFiles);
    return modules;
  }
}

export default TerraformAwsCorePlugin;
