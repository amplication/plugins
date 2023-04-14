import type {
  AmplicationPlugin,
  CreateServerDotEnvParams,
  CreateAdminUIParams,
  DsgContext,
  Events,
  Module,
  PluginInstallation,
} from "@amplication/code-gen-types";
import {
  applicationVersionKey,
  chartVersionKey,
  configurationKey,
  repositoryKey,
  serviceNameKey,
  tagKey
} from "./constants";
import { getPluginSettings } from "./utils"
import { resolve } from "path";
import { EventNames } from "@amplication/code-gen-types";
import { parse, stringify } from 'yaml'

class HelmChartPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServerDotEnv]: {
        after: this.afterCreateServerDotEnv,
      },
      // [EventNames.CreateAdminUI]: {
      //   after: this.afterCreateAdminUI,
      // },
    };
  }

  async afterCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams,
    modules: Module[]
  ) {
    const staticPath = resolve(__dirname, "./static");
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.srcDirectory
    );

    // fetch user settings + merge with default settings
    const settings = getPluginSettings(context.pluginInstallations);

    // determine the name of the service which will be used as the name for the helm chart
    const serviceName = context.resourceInfo?.name
      .toLocaleLowerCase()
      .replaceAll(" ", "-");

    // chart names must be lower case letters and numbers. words may be separated with dashes (-):
    // to-do: write logic that removes anything that isnt a letters, number or dash
    if (!serviceName) {
      throw new Error("Service name is undefined");
    }

    // fetch the variables from the .env file and create a variable for it which can be 
    // used to fill the configmap secrets should be moved by the users themself
    const variables = eventParams.envVariables;

    if (!variables) {
      throw new Error("Variables can't be fetched");
    }

    const configmapIndentation = "    ";
    let configmap: string= "";

    Object.entries(variables).forEach(([name, value]) => {
      if(configmap === ""){
        configmap = `${name}: ${value}`;
      }
      else {
        configmap = `${configmap}\n${configmapIndentation}${name}: ${value}`;
      }
    })

    // render the helm chart from the static files in combination with the values provided through
    // the settings
    const renderdOutput = staticsFiles
      .map(
        (file): Module => ({
          path: file.path,
          code: file.code
            .replaceAll(serviceNameKey, serviceName)
            .replace(chartVersionKey, settings.server.chart_version)
            .replace(applicationVersionKey, settings.server.application_version)
            .replace(repositoryKey, settings.server.repository)
            .replace(tagKey, settings.server.tag)
            .replace(configurationKey, configmap),
        })
      );

    // save the renderedOutput to the desired directory the options are on the root of the repository 
    // and within the directory of the services itself setting "root_directory"
      // option 1 (value: true):  /<directory_name_value>/<service_name>
        // create directory on the root of the repository (../) with the name provided
        // through the settings.directory_name, subsequently place all of the files that
        // from the static directory via the renderdOutput variable
      // option 2 (value: false): /<service_name>/<directory_name_value>/<service_name>
        // create directory within the directory of the service with the name provided
        // through the settings.directory_name, subsequently place all of the files that
        // from the static directory via the renderdOutput variable
    if (settings.root_level == true) {
      // TODO: option true
    } else if (settings.root_level == false) {
      // TODO: option false
    } else {
      throw new Error("Specify true or false for the root_level setting");
    }

    return [...modules, ...renderdOutput];
  }

  // async afterCreateAdminUI(
  //   context: DsgContext,
  //   eventParams: CreateAdminUIParams,
  //   modules: Module[]
  // ) {
  //   const staticPath = resolve(__dirname, "./static");
  //   const staticsFiles = await context.utils.importStaticModules(
  //     staticPath,
  //     context.serverDirectories.srcDirectory
  //   );

  //   // determine the name of the service which will be used
  //   // as the name for the helm chart
  //   const serviceName = context.resourceInfo?.name
  //     .toLocaleLowerCase()
  //     .replaceAll(" ", "-");

  //   // fetch user settings + merge with default settings
  //   const settings = getPluginSettings(context.pluginInstallations);

  //   const settings = merge(defaultSettings, userSettings);

  //   if (settings.admin_ui.enabled == false) {
  //     // throw info message "Not generating helm chart for admin-ui as admin_ui.enabled is false"
  //   } else if (settings.admin_ui.enabled == true) {
  //     // fetch the variables from the .env file and create a variable for it which can be 
  //     // used to fill the configmap secrets should be moved by the users themself
  //     // const variables = eventParams.envVariables;

  //     if (!variables) {
  //       throw new Error("Variables can't be fetched");
  //     }

  //     // render the helm chart from the static files
  //     // in combination with the values provided through
  //     // the settings
  //     const renderdOutput = staticsFiles
  //       .map(
  //         (file): Module => ({
  //           path: file.path,
  //           code: file.code
  //             .replaceAll(serviceNameKey, serviceName)
  //             .replace(chartVersionKey, settings.admin_ui.chart_version)
  //             .replace(applicationVersionKey, settings.admin_ui.application_version)
  //             .replace(repositoryKey, settings.admin_ui.repository)
  //             .replace(tagKey, settings.admin_ui.tag)
  //             .replace(configurationKey, variables)
  //         })
  //       );

  //     return [...modules, ...renderdOutput];
  //   } else {
  //     throw new Error("The setting admin_ui needs to be either 'true' or 'false' ");
  //   }
  // }
};

export default HelmChartPlugin;
