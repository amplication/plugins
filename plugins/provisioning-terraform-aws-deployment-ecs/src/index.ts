import type {
  AmplicationPlugin,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
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
import { EventNames } from "@amplication/code-gen-types";
import { resolve } from "path";
import { getPluginSettings, getTerraformDirectory } from "./utils";
import { kebabCase, snakeCase } from "lodash";

class TerraformAwsDeploymentEcsPlugin implements AmplicationPlugin {
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

    const templateFileName: string = "ecs-template.tf";
    const fileNamePrefix: string = "ecs-";
    const fileNameSuffix: string = ".tf";
    const ecsServiceName: string = settings.service.name
      ? settings.service.name
      : serviceName;
    const ecsClusterName: string = settings.cluster.name
    ? settings.cluster.name
    : serviceName;

    const staticPath = resolve(__dirname, "./static");
    const staticFiles = await context.utils.importStaticModules(
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

    staticFiles.replaceModulesPath((path) =>
      path.replace(templateFileName, fileNamePrefix + kebabCase(serviceName) + fileNameSuffix)
    );

    staticFiles.replaceModulesCode((code) =>
      code
        .replaceAll(clusterHyphenNameKey, hyphenClusterName)
        .replaceAll(clusterUnderscoreNameKey, underscoreClusterName)
        .replaceAll(serviceHyphenNameKey, hyphenServiceName)
        .replaceAll(serviceUnderscoreNameKey, underscoreServiceName)
        .replaceAll(moduleNameEcsClusterKey, "ecs_cluster_" + underscoreClusterName)
        .replaceAll(moduleNameEcsServiceKey, "ecs_service_" + underscoreServiceName)
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
        )
    );

    context.logger.info(`Generated Terraform AWS Deployment ECS...`);

    await modules.merge(staticFiles);
    return modules;
  }
}

export default TerraformAwsDeploymentEcsPlugin;
