import {
  dotnetPluginEventsTypes,
  dotnetPluginEventsParams as dotnet,
  dotnetTypes,
  FileMap,
  IFile,
} from "@amplication/code-gen-types";
import { CodeBlock } from "@amplication/csharp-ast";
import {
  clusterHyphenNameKey,
  clusterUnderscoreNameKey,
  moduleNameEcsClusterKey,
  moduleNameEcsServiceKey,
  moduleNameEcsAlbKey,
  moduleNameEcsSgKey,
  clusterCapacityProviderKey,
  serviceContainerImage,
  serviceContainerPort,
  serviceHyphenNameKey,
  serviceUnderscoreNameKey,
} from "./constants";
import { resolve } from "path";
import { getPluginSettings, getTerraformDirectory } from "./utils";
import { kebabCase, snakeCase } from "lodash";

class TerraformAwsDeploymentEcsPlugin implements dotnetTypes.AmplicationPlugin {
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
    context.logger.info(`Generating Terraform AWS Deployment ECS...`);

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

    const templateFileName = "ecs-template.tf";
    const fileNamePrefix = "ecs-";
    const fileNameSuffix = ".tf";
    const ecsServiceName: string = settings.service.name
      ? settings.service.name
      : serviceName;
    const ecsClusterName: string = settings.cluster.name
      ? settings.cluster.name
      : serviceName;

    const staticPath = resolve(__dirname, "./static");
    const staticFiles = await context.utils.importStaticFiles(
      staticPath,
      terraformDirectory
    );

    // switch statement for determining capacity provider within the
    // cluster configuration, default to fargate
    let capacityProvider: string;
    switch (settings.cluster.capacity_provider.type) {
      default: {
        capacityProvider = `fargate_capacity_providers = {
    FARGATE = {
      default_capacity_provider_strategy = {
        weight = ${settings.cluster.capacity_provider.fargate?.fargate_weight}
        base   = ${settings.cluster.capacity_provider.fargate?.fargate_base}
      }
    }
    FARGATE_SPOT = {
      default_capacity_provider_strategy = {
        weight = ${settings.cluster.capacity_provider.fargate?.fargate_spot_weight}
      }
    }
  }`;
      }
    }

    const hyphenServiceName: string = kebabCase(ecsServiceName);
    const underscoreServiceName: string = snakeCase(ecsServiceName);
    const hyphenClusterName: string = kebabCase(ecsClusterName);
    const underscoreClusterName: string = snakeCase(ecsClusterName);
    for (const item of staticFiles.getAll()) {
      const newPath = item.path.replace(
        templateFileName,
        fileNamePrefix + kebabCase(serviceName) + fileNameSuffix
      );

      const newCode = item.code
        .replaceAll(clusterHyphenNameKey, hyphenClusterName)
        .replaceAll(clusterUnderscoreNameKey, underscoreClusterName)
        .replaceAll(serviceHyphenNameKey, hyphenServiceName)
        .replaceAll(serviceUnderscoreNameKey, underscoreServiceName)
        .replaceAll(
          moduleNameEcsClusterKey,
          "ecs_cluster_" + underscoreClusterName
        )
        .replaceAll(
          moduleNameEcsServiceKey,
          "ecs_service_" + underscoreServiceName
        )
        .replaceAll(moduleNameEcsAlbKey, "ecs_alb_" + underscoreServiceName)
        .replaceAll(moduleNameEcsSgKey, "ecs_alb_sg_" + underscoreServiceName)
        .replaceAll(clusterCapacityProviderKey, capacityProvider)
        .replaceAll(
          serviceContainerImage,
          settings.service.container_definitions.image
        )
        .replaceAll(
          serviceContainerPort,
          String(settings.service.container_definitions.port)
        );
      const file: IFile<CodeBlock> = {
        path: newPath,
        code: new CodeBlock({
          code: newCode,
        }),
      };
      files.set(file);
    }

    context.logger.info(`Generated Terraform AWS Deployment ECS...`);

    return files;
  }
}

export default TerraformAwsDeploymentEcsPlugin;
