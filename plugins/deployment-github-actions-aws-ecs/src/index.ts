import type {
  AmplicationPlugin,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import {
  regionIdentifierKey,
  accountIdentifierKey,
  ecrImageTagKey,
  ecrRepositoryNameKey,
  serviceNameKey,
  ecsClusterNameKey,
  ecsRoleNameKey,
  ecsTaskDefinitionPathKey,
  smSecretNameKey,
  resourcesCpuKey,
  resourcesMemoryKey,
  runtimeCpuArchitectureKey,
  runtimeOsFamilyKey,
  dockerFilePathKey,
} from "./constants";
import { getPluginSettings } from "./utils";
import { EventNames } from "@amplication/code-gen-types";
import { resolve } from "path";
import { kebabCase } from "lodash";

class GithubActionsAwsEcsPlugin implements AmplicationPlugin {
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
      "Generating Github Actions deploy to Amazon ECS workflow ..."
    );

    // determine the name of the service which will be used as the name for the workflow
    // workflow names must be lower case letters and numbers. words may be separated with dashes (-):
    const serviceName = kebabCase(context.resourceInfo?.name);

    if (!serviceName) {
      throw new Error("Service name is undefined");
    }

    // template file names
    const templateWorkflowFileName = "workflow.yaml";
    const templateTaskDefinitionFileName = "task-definition.json";

    // output file name prefix & suffixes
    const fileNamePrefix = "cd-";
    const workflowFileNameSuffix = "-aws-ecs.yaml";
    const taskDefinitionFileNameSuffix = "-aws-ecs.json";

    // ouput directory base & file specific suffix
    const outputDirectoryBase = ".github/workflows";
    const outputSuffixWorkflow: string =
      "/" + fileNamePrefix + serviceName + workflowFileNameSuffix;
    const outputSuffixTaskDefinition: string =
      "/configuration/" +
      fileNamePrefix +
      serviceName +
      taskDefinitionFileNameSuffix;

    // getPluginSettings: fetch user settings + merge with default settings
    const settings = getPluginSettings(context.pluginInstallations);
    const staticPath = resolve(__dirname, "./static");

    const staticFiles = await context.utils.importStaticModules(
      staticPath,
      "./" + outputDirectoryBase
    );

    staticFiles.replaceModulesPath((path) =>
      path
        .replace(templateWorkflowFileName, outputSuffixWorkflow)
        .replace(templateTaskDefinitionFileName, outputSuffixTaskDefinition)
    );

    staticFiles.replaceModulesCode((_path, code) =>
      code
        .replaceAll(serviceNameKey, serviceName)
        .replaceAll(regionIdentifierKey, settings.region_identifier)
        .replaceAll(accountIdentifierKey, settings.account_identifier)
        .replaceAll(ecrRepositoryNameKey, settings.ecr_repository_name)
        .replaceAll(ecrImageTagKey, settings.ecr_image_tag)
        .replaceAll(ecsClusterNameKey, settings.ecs_cluster_name)
        .replaceAll(ecsRoleNameKey, settings.ecs_role_name)
        .replaceAll(
          ecsTaskDefinitionPathKey,
          outputDirectoryBase + outputSuffixTaskDefinition
        )
        .replaceAll(smSecretNameKey, settings.sm_secret_name)
        .replaceAll(resourcesCpuKey, settings.resources.cpu)
        .replaceAll(resourcesMemoryKey, settings.resources.memory)
        .replaceAll(runtimeOsFamilyKey, settings.runtime.os_family)
        .replaceAll(
          runtimeCpuArchitectureKey,
          settings.runtime.cpu_architecture
        )
        .replaceAll(dockerFilePathKey, context.serverDirectories.baseDirectory)
    );

    context.logger.info(
      "Generated Github Actions deploy to Amazon ECS workflow..."
    );

    await modules.merge(staticFiles);
    return modules;
  }
}

export default GithubActionsAwsEcsPlugin;
