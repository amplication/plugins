import type {
  AmplicationPlugin,
  CreateServerDotEnvParams,
  DsgContext,
  Events,
  Module,
} from "@amplication/code-gen-types";
import {
  applicationVersionKey,
  chartVersionKey,
  configurationKey,
  hostKey,
  portKey,
  repositoryKey,
  serviceNameKey,
  tagKey,
} from "./constants";
import { join } from "node:path";
import { getPluginSettings } from "./utils";
import { resolve } from "path";
import { EventNames } from "@amplication/code-gen-types";
import { kebabCase } from "lodash";

class HelmChartPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServerDotEnv]: {
        after: this.afterCreateServerDotEnv,
      },
      // [EventNames.CreateAdminUIDotEnv]: {
      //   after: this.afterCreateAdminUIDotEnv,
      // },
    };
  }

  async afterCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams,
    modules: Module[]
  ) {
    context.logger.info(`Generating Helm Chart...`);

    // determine the name of the service which will be used as the name for the helm chart
    // chart names must be lower case letters and numbers. words may be separated with dashes (-):
    const serviceName = kebabCase(context.resourceInfo?.name);

    if (!serviceName) {
      throw new Error("Service name is undefined");
    }

    // fetch user settings + merge with default settings
    const settings = getPluginSettings(context.pluginInstallations);

    // fetch the variables from the .env file and create a variable for it which can be
    // used to fill the configmap, secrets should be moved by the users themself
    const variables = eventParams.envVariables;

    if (!variables) {
      throw new Error("Variables can't be fetched");
    }

    const configmapIndentation = "    ";
    let configmap: string = "";

    variables.forEach((variable) => {
      const [name, value] = Object.entries(variable)[0];
      configmap = `${configmap}\n${configmapIndentation}${name}: ${value}`;
    });

    /**
     * save the renderedOutput to the desired directory the options are on the root of the repository
     * and within the directory of the services itself setting "root_directory":
     *
     *    option 1 (value: true):  /<directory_name_value>/<service_name>
     *         create directory on the root of the repository (../) with the name provided
     *         through the settings.directory_name, subsequently place all of the files that
     *         from the static directory via the renderdOutput variable
     *
     *    option 2 (value: false): /<service_name>/<directory_name_value>/<service_name>
     *         create directory within the directory of the service with the name provided
     *         through the settings.directory_name, subsequently place all of the files that
     *         from the static directory via the renderdOutput variable
     */

    let helmDirectoryPath: string = "";
    const rootDirectoryPath: string = "./";

    if (settings.root_level === true) {
      helmDirectoryPath = join(
        context.serverDirectories.baseDirectory,
        rootDirectoryPath,
        settings.directory_name
      );
    } else if (settings.root_level === false) {
      helmDirectoryPath = join(
        context.serverDirectories.baseDirectory,
        settings.directory_name
      );
    } else {
      throw new Error(
        "HelmChartPlugin: Specify true or false for the root_level setting"
      );
    }
    const defaultStaticFiles: string = "./static/";

    const staticPath = resolve(__dirname, defaultStaticFiles);
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      helmDirectoryPath
    );

    // render the helm chart from the static files in combination with the values provided through
    // the settings
    const renderdOutput = staticsFiles.map(
      (file): Module => ({
        path: file.path.replace("chart", serviceName),
        code: file.code
          .replaceAll(serviceNameKey, serviceName)
          .replaceAll(chartVersionKey, settings.server.chart_version)
          .replaceAll(
            applicationVersionKey,
            settings.server.application_version
          )
          .replaceAll(repositoryKey, settings.server.repository)
          .replaceAll(tagKey, settings.server.tag)
          .replaceAll(portKey, settings.server.port)
          .replaceAll(hostKey, settings.server.host)
          .replaceAll(configurationKey, configmap),
      })
    );

    context.logger.info("Configuring Helm chart template...");
    return [...modules, ...renderdOutput];
  }

  /**
   * Implementation of the AdminUI part of generation of a helm Chart requires the
   * 'afterCreateAdminUIDotEnv' event to be implemented:
   *
   * link: https://github.com/amplication/amplication/issues/5836
   */
}

export default HelmChartPlugin;
