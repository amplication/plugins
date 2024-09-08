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
  regionIdentifierKey,
  vpcCidrBlockKey,
  enableDnsHostnamesKey,
  enableDnsSupportKey,
  enableNatGatewayKey,
  singleNatGatewayKey,
  environmentKey,
  backendKey,
  createDatabaseSubnetGroupKey,
} from "./constants";
import { join } from "node:path";
import { getPluginSettings } from "./utils";
import { BackendTypes } from "./types";
import { resolve } from "path";
import { kebabCase } from "lodash";

class TerraformAwsCorePlugin implements dotnetTypes.AmplicationPlugin {
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

    const rootDirectoryPath = "./";
    const terraformDirectoryPath: string = settings.root_level
      ? join(rootDirectoryPath, settings.directory_name)
      : join(context.serverDirectories.baseDirectory, settings.directory_name);

    // define some configuration based on input/defaults
    const name: string = settings.global.name
      ? serviceName
      : settings.global.name;

      let backendConfiguration = "";
    switch (settings.backend.type) {
      case BackendTypes.Local:
        backendConfiguration = `terraform {
    backend "local" {
      path = "${settings.backend?.local?.path}"
    }
  }`;
        break;
      case BackendTypes.S3:
        backendConfiguration = `terraform {
    backend "s3" {
      bucket = "${settings.backend?.s3?.bucket_name}"
      key    = "${settings.backend?.s3?.key}"
      region = "${settings.backend?.s3?.region}"
    }
  }`;
        break;
    }

    // set the path to the static files and fetch them for manipulation
    const staticPath = resolve(__dirname, "./static");
    const staticFiles = await context.utils.importStaticFiles(
      staticPath,
      terraformDirectoryPath
    );

    context.logger.info("Generated Terraform Amazon Web Services Core ...");
    for (const item of staticFiles.getAll()) {
      const newCode = item.code
        .replaceAll(nameKey, name)
        .replaceAll(regionIdentifierKey, settings.global.region)
        .replaceAll(environmentKey, settings.global.environment)
        .replaceAll(vpcCidrBlockKey, settings.vpc.cidr_block)
        .replaceAll(
          createDatabaseSubnetGroupKey,
          String(settings.vpc.create_database_subnet_group)
        )
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
        .replaceAll(backendKey, backendConfiguration);

      const file: IFile<CodeBlock> = {
        path: item.path,
        code: new CodeBlock({
          code: newCode,
        }),
      };
      files.set(file);
    }
    return files;
  }
}

export default TerraformAwsCorePlugin;
