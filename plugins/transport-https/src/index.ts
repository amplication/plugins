import type {
  AmplicationPlugin,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { EventNames, Module } from "@amplication/code-gen-types";
import {
  packageJsonValues,
  placeHolderValues,
  staticsPath,
  templatesPath,
} from "./constants";
import { convertToVarDict, getPluginSettings } from "./utils";
import fs from "fs";
import path from "path";

class TransportHttpsPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServerPackageJson]: {
        before: this.beforeCreateServerPackageJson,
      },
      [EventNames.CreateServerDotEnv]: {
        before: this.beforeCreateServerDotEnv,
      },
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
    const settings = getPluginSettings(context.pluginInstallations);
    const logger = context.logger;

    // 1. Import static files and replace placeholders
    await logger.info("Importing static files...");
    const staticFiles = await context.utils.importStaticModules(
      staticsPath,
      context.serverDirectories.baseDirectory
    );

    staticFiles.replaceModulesCode((_, code) => {
      Object.entries(placeHolderValues).forEach(([key, value]) => {
        code = code.replaceAll(
          value,
          settings[key as keyof typeof placeHolderValues]
        );
      });

      return code;
    });

    await modules.merge(staticFiles);
    await logger.info("Static files imported successfully");

    // 2. Replace with custom main.ts file
    await logger.info("Replacing main.ts file...");
    const mainFileContent = fs.readFileSync(
      path.resolve(__dirname, templatesPath, "main.template.ts"),
      "utf-8"
    );

    const mainModule: Module = {
      path: path.join(context.serverDirectories.srcDirectory, "main.ts"),
      code: mainFileContent,
    };

    modules.set(mainModule);
    await logger.info("main.ts file replaced successfully");

    return modules;
  }

  async beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams
  ): Promise<CreateServerPackageJsonParams> {
    const { updateProperties } = eventParams;

    updateProperties.push(packageJsonValues);

    return eventParams;
  }

  async beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams
  ): Promise<CreateServerDotEnvParams> {
    const settings = getPluginSettings(context.pluginInstallations);
    const {
      appMode,
      httpsCertDir,
      httpsCertName,
      caCertName,
      httpsKeyName,
      httpsPort,
    } = settings;

    const envVariables = {
      APP_MODE: appMode,
      HTTPS_PORT: httpsPort.toString(),
      SSL_CERT_PATH: `./${httpsCertDir}/${httpsCertName}`,
      SSL_KEY_PATH: `./${httpsCertDir}/${httpsKeyName}`,
      CA_CERT_PATH: `./${httpsCertDir}/${caCertName}`,
    };

    eventParams.envVariables = eventParams.envVariables.concat(
      convertToVarDict(envVariables)
    );

    return eventParams;
  }
}

export default TransportHttpsPlugin;
