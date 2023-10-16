import type {
  AmplicationPlugin,
  CreateAdminUIParams,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
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
    context.logger.info("Generating Github Actions deploy to Amazon ECS workflow ...");

    // determine the name of the service which will be used as the name for the workflow
    // workflow names must be lower case letters and numbers. words may be separated with dashes (-):
    const serviceName = kebabCase(context.resourceInfo?.name);

    if (!serviceName) {
      throw new Error("Service name is undefined");
    }
    
    // getPluginSettings: fetch user settings + merge with default settings
    const settings = getPluginSettings(context.pluginInstallations);

    const staticPath = resolve(__dirname, "./static");
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.srcDirectory
    );
    
    const templateFileName: string = "workflow.yaml";
    const FileNamePrefix: string = "cd-";
    const FileNameSuffix: string = "-aws-ecs.yaml";
    const outputDirectoryWorkflowFile: string = "./.github/workflows/";
    const outputDirectoryTaskDefinitionFile: string = "./.github/configuration/";

    // TODO: path to dockerfile, on 'build, tag and push image' step




    context.logger.info("Generated Github Actions deploy to Amazon ECS workflow...");
    await modules.merge(staticsFiles);
    return modules;
  }
}

export default GithubActionsAwsEcsPlugin;
