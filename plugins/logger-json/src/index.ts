import {
  EventNames,
  type AmplicationPlugin,
  type Events,
  DsgContext,
  CreateServerDotEnvParams,
  CreateServerParams,
  ModuleMap,
  CreateServerPackageJsonParams,
  CreateServerAppModuleParams,
} from "@amplication/code-gen-types";
import {
  appendImports,
  parse,
  print,
  readFile,
} from "@amplication/code-gen-utils";
import { getPluginSettings } from "./utils";
import { resolve, join } from "path";
import { importNames, interpolate } from "./utils/ast";
import { propertiesToAST } from "./utils/jsonToAst";
import { dependencies } from "./constants";
import { builders } from "ast-types";
import { useLoggerInMain } from "./utils/useLoggerInMain";

class LoggerJSONPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServerDotEnv]: {
        before: this.beforeCreateServerDotEnv,
      },
      [EventNames.CreateServer]: {
        after: this.afterCreateServer,
      },
      [EventNames.CreateServerPackageJson]: {
        before: this.beforeCreateServerPackageJSON,
      },
      [EventNames.CreateServerAppModule]: {
        before: this.beforeCreateServerAppModule,
        after: this.afterCreateServerAppModule,
      },
    };
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams,
  ) {
    const { logLevel: LOG_LEVEL } = getPluginSettings(
      context.pluginInstallations,
    );
    const SERVICE_NAME = context.resourceInfo?.name ?? "";

    eventParams.envVariables = [
      ...eventParams.envVariables,
      ...[{ LOG_LEVEL }, { SERVICE_NAME }],
    ];

    return eventParams;
  }

  async afterCreateServer(
    context: DsgContext,
    params: CreateServerParams,
    modules: ModuleMap,
  ) {
    const { additionalLogProperties: extras } = getPluginSettings(
      context.pluginInstallations,
    );

    // Use custom logger in main.ts
    useLoggerInMain(
      context.serverDirectories.srcDirectory,
      modules,
      context.logger,
    );

    // Import static files
    const staticFiles = await context.utils.importStaticModules(
      resolve(__dirname, "static"),
      join(context.serverDirectories.srcDirectory, "logger"),
    );

    await modules.merge(staticFiles);

    // Copy templates
    const template = await readFile(
      resolve(__dirname, "templates", "logger.config.ts"),
    );

    interpolate(template, {
      ADDITIONAL_LOG_PROPERTIES_KEY: propertiesToAST(extras),
    });

    await modules.set({
      code: print(template).code,
      path: join(
        context.serverDirectories.srcDirectory,
        "logger",
        "logger.config.ts",
      ),
    });

    return modules;
  }

  beforeCreateServerPackageJSON(
    _: DsgContext,
    eventParams: CreateServerPackageJsonParams,
  ) {
    eventParams.updateProperties.push(dependencies);

    return eventParams;
  }

  beforeCreateServerAppModule(
    _: DsgContext,
    eventParams: CreateServerAppModuleParams,
  ) {
    const loggerModuleId = builders.identifier("LoggerModule");

    const importArray = builders.arrayExpression([
      loggerModuleId,
      ...eventParams.templateMapping["MODULES"].elements,
    ]);

    eventParams.templateMapping["MODULES"] = importArray;

    return eventParams;
  }

  async afterCreateServerAppModule(
    context: DsgContext,
    _: CreateServerAppModuleParams,
    modules: ModuleMap,
  ) {
    const [appModule] = modules.modules();

    if (!appModule) return modules;

    const file = parse(appModule.code);
    const loggerModuleId = builders.identifier("LoggerModule");

    const loggerModuleImport = importNames(
      [loggerModuleId],
      "./logger/logger.module",
    );

    appendImports(file, [loggerModuleImport]);

    const updatedModules = new ModuleMap(context.logger);
    appModule.code = print(file).code;
    await updatedModules.set(appModule);
    return updatedModules;
  }
}

export default LoggerJSONPlugin;
