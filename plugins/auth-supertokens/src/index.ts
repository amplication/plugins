import {
  AmplicationPlugin,
  CreateConnectMicroservicesParams,
  CreateEntityModuleParams,
  CreateServerAppModuleParams,
  CreateServerAuthParams,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  CreateServerParams,
  CreateDTOsParams,
  DsgContext,
  Events,
  ModuleMap,
  CreateEntityControllerParams,
  CreateEntityControllerBaseParams,
  CreateEntityResolverParams,
  CreateEntityResolverBaseParams,
  CreateAdminUIPackageJsonParams,
  CreateAdminDotEnvParams,
  CreateAdminUIParams,
  CreateAdminAppModuleParams,
  CreateSeedParams,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { resolve } from "path";
import { readFile } from "@amplication/code-gen-utils";
import { camelCase, merge } from "lodash";
import { join } from "path";
import { builders, namedTypes } from "ast-types";
import * as utils from "./utils";
import * as constants from "./constants";
import {
  addRemoveAuthFiles,
  alterGraphqlSettingsInAppModule,
  removeRemoveDefaultCorsSettingInMain,
  addAuthModuleInAuthDir,
  injectAuthService,
  createSupertokensService,
  createAuthService,
  verifyAuthCorePluginIsInstalled,
  addSupertokensConfigFile,
  replaceLoginPage,
  replaceTypesModule,
  replaceDataProviderModule,
  addSupertokensAuthProvider,
  removeNonSupertokensAuthProviderImportsFromAppModule,
  removeNonSupertokensAuthProviderModules,
  addConsumeMagicLinkModule,
  addAuthCallbackModule,
  removeUnneededAdminUIFiles,
  addAuthFilter,
  addAppCorsSettings,
  addGenSupertokensOptionsImport,
  verifySupertokensIdFieldExists,
} from "./core";
import { EnumAuthProviderType } from "@amplication/code-gen-types/src/models";

/**
 * These values are used to check if various things that ought to be
 * done have been done after the creation of the server files
 */
export const checks = {
  addedAuthModuleInAuthDir: false,
  alteredAuthEntityController: false,
  alteredAuthEntityControllerBase: false,
  alteredAuthEntityResolver: false,
  alteredAuthEntityResolverBase: false,
};

class SupertokensAuthPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServerAuth]: {
        after: this.afterCreateServerAuth,
      },
      [EventNames.CreateServerPackageJson]: {
        before: this.beforeCreateServerPackageJson,
      },
      [EventNames.CreateConnectMicroservices]: {
        before: this.beforeCreateConnectMicroservices,
      },
      [EventNames.CreateServerAppModule]: {
        before: this.beforeCreateServerAppModule,
        after: this.afterCreateServerAppModule,
      },
      [EventNames.CreateServerDotEnv]: {
        before: this.beforeCreateServerDotEnv,
      },
      [EventNames.CreateServer]: {
        before: this.beforeCreateServer,
        after: this.afterCreateServer,
      },
      [EventNames.CreateEntityModule]: {
        after: this.afterCreateEntityModule,
      },
      [EventNames.CreateDTOs]: {
        after: this.afterCreateDTOs,
      },
      [EventNames.CreateEntityController]: {
        before: this.beforeCreateEntityController,
      },
      [EventNames.CreateEntityControllerBase]: {
        before: this.beforeCreateEntityControllerBase,
      },
      [EventNames.CreateEntityResolver]: {
        before: this.beforeCreateEntityResolver,
      },
      [EventNames.CreateEntityResolverBase]: {
        before: this.beforeCreateEntityResolverBase,
      },
      [EventNames.CreateAdminUIPackageJson]: {
        before: this.beforeCreateAdminUIPackageJson,
      },
      [EventNames.CreateAdminDotEnv]: {
        before: this.beforeCreateAdminDotEnv,
      },
      [EventNames.CreateAdminUI]: {
        after: this.afterCreateAdminUI,
      },
      [EventNames.CreateAdminAppModule]: {
        before: this.beforeCreateAdminAppModule,
        after: this.afterCreateAdminAppModule,
      },
      [EventNames.CreateSeed]: {
        before: this.beforeCreateSeed,
      },
    };
  }

  async beforeCreateSeed(
    context: DsgContext,
    eventParams: CreateSeedParams,
  ): Promise<CreateSeedParams> {
    const path = resolve(constants.templatesPath, "seed.template.ts");
    eventParams.template = await readFile(path);
    const data = eventParams.templateMapping
      .DATA as namedTypes.ObjectExpression;
    const passwordProp = data.properties.find(
      (prop) =>
        prop.type === "ObjectProperty" &&
        prop.key.type === "Identifier" &&
        prop.key.name === "password",
    );
    if (passwordProp) {
      const prop = passwordProp as namedTypes.ObjectProperty;
      // Remove the hash() invocation from the password property's value
      prop.value = builders.stringLiteral("admin");
    }
    return eventParams;
  }

  async beforeCreateAdminAppModule(
    context: DsgContext,
    eventParams: CreateAdminAppModuleParams,
  ): Promise<CreateAdminAppModuleParams> {
    const settings = utils.getPluginSettings(context.pluginInstallations);
    const newTemplatePath = join(
      constants.templatesPath,
      "admin-ui",
      settings.recipe.name,
      "App.template.tsx",
    );
    const newTemplate = await readFile(newTemplatePath);
    context.logger.info("Replacing the admin UI app template");
    eventParams.template = newTemplate;
    // The resulting auth provider effects on the app module will still
    // be removed in the afterCreateAdminAppModule
    if (context.resourceInfo) {
      context.resourceInfo.settings.authProvider = EnumAuthProviderType.Http;
    }

    return eventParams;
  }

  async afterCreateAdminAppModule(
    context: DsgContext,
    eventParams: CreateAdminAppModuleParams,
    modules: ModuleMap,
  ): Promise<ModuleMap> {
    const { srcDirectory } = context.clientDirectories;

    removeNonSupertokensAuthProviderImportsFromAppModule(
      srcDirectory,
      modules,
      context.logger,
    );

    return modules;
  }

  async afterCreateAdminUI(
    context: DsgContext,
    eventParams: CreateAdminUIParams,
    modules: ModuleMap,
  ): Promise<ModuleMap> {
    const { srcDirectory } = context.clientDirectories;
    const settings = utils.getPluginSettings(context.pluginInstallations);
    removeUnneededAdminUIFiles(srcDirectory, modules, context.logger);
    await addSupertokensConfigFile(
      srcDirectory,
      modules,
      settings.recipe.name,
      context.logger,
    );
    await replaceLoginPage(srcDirectory, modules, settings, context.logger);
    await replaceTypesModule(srcDirectory, modules, settings, context.logger);
    await replaceDataProviderModule(srcDirectory, modules, context.logger);
    await addSupertokensAuthProvider(
      srcDirectory,
      modules,
      settings,
      context.logger,
    );
    removeNonSupertokensAuthProviderModules(
      srcDirectory,
      modules,
      context.logger,
    );
    if (
      (settings.recipe.name === "passwordless" ||
        settings.recipe.name === "thirdpartypasswordless") &&
      (settings.recipe.flowType === "MAGIC_LINK" ||
        settings.recipe.flowType === "USER_INPUT_CODE_AND_MAGIC_LINK")
    ) {
      await addConsumeMagicLinkModule(
        srcDirectory,
        modules,
        settings.recipe.name,
        context.logger,
      );
    }
    if (
      settings.recipe.name === "thirdparty" ||
      settings.recipe.name === "thirdpartyemailpassword" ||
      settings.recipe.name === "thirdpartypasswordless"
    ) {
      await addAuthCallbackModule(
        srcDirectory,
        modules,
        settings.recipe.name,
        context.logger,
      );
    }

    return modules;
  }

  beforeCreateAdminDotEnv(
    context: DsgContext,
    eventParams: CreateAdminDotEnvParams,
  ): CreateAdminDotEnvParams {
    const { getPluginSettings, settingsToVarDict, varDictToReactEnvVars } =
      utils;
    const settings = getPluginSettings(context.pluginInstallations);
    const neededVars = [
      "SUPERTOKENS_APP_NAME",
      "SUPERTOKENS_API_DOMAIN",
      "SUPERTOKENS_WEBSITE_DOMAIN",
      "SUPERTOKENS_API_BASE_PATH",
    ];
    const varsForAdminUi = settingsToVarDict(settings).filter((val) => {
      const varName = Object.keys(val)[0];
      return neededVars.includes(varName);
    });
    context.logger.info(
      "Adding react environment variables in admin UI .env file",
    );
    eventParams.envVariables.push(...varDictToReactEnvVars(varsForAdminUi));

    return eventParams;
  }

  beforeCreateAdminUIPackageJson(
    context: DsgContext,
    eventParams: CreateAdminUIPackageJsonParams,
  ): CreateAdminUIPackageJsonParams {
    const settings = utils.getPluginSettings(context.pluginInstallations);
    const deps = constants.adminUIDependencies(settings.recipe.name);

    context.logger.info(
      "Adding dependencies to the admin UI's package.json file",
    );
    eventParams.updateProperties.forEach((updateProperty) => {
      merge(updateProperty, deps);
    });

    return eventParams;
  }

  beforeCreateEntityResolver(
    context: DsgContext,
    eventParams: CreateEntityResolverParams,
  ): CreateEntityResolverParams {
    const authEntityName = context.resourceInfo?.settings.authEntityName;
    if (camelCase(authEntityName ?? "") === eventParams.entityName) {
      injectAuthService(eventParams.template, 1, context.logger);
      checks.alteredAuthEntityResolver = true;
    }
    return eventParams;
  }

  beforeCreateEntityResolverBase(
    context: DsgContext,
    eventParams: CreateEntityResolverBaseParams,
  ): CreateEntityResolverBaseParams {
    const authEntityName = context.resourceInfo?.settings.authEntityName;
    if (camelCase(authEntityName ?? "") === eventParams.entityName) {
      injectAuthService(eventParams.template, 2, context.logger);
      checks.alteredAuthEntityResolverBase = true;
    }
    return eventParams;
  }

  beforeCreateEntityController(
    context: DsgContext,
    eventParams: CreateEntityControllerParams,
  ): CreateEntityControllerParams {
    const authEntityName = context.resourceInfo?.settings.authEntityName;
    if (camelCase(authEntityName ?? "") === eventParams.entityName) {
      injectAuthService(eventParams.template, 1, context.logger);
      checks.alteredAuthEntityController = true;
    }
    return eventParams;
  }

  beforeCreateEntityControllerBase(
    context: DsgContext,
    eventParams: CreateEntityControllerBaseParams,
  ): CreateEntityControllerBaseParams {
    const authEntityName = context.resourceInfo?.settings.authEntityName;
    if (!authEntityName) {
      context.logger.error("Failed to find the auth entity");
      throw new Error("Failed to find the auth entity name");
    }
    if (camelCase(authEntityName ?? "") === eventParams.entityName) {
      injectAuthService(eventParams.template, 2, context.logger);
      checks.alteredAuthEntityControllerBase = true;
    }
    return eventParams;
  }

  async afterCreateDTOs(
    context: DsgContext,
    eventParams: CreateDTOsParams,
    modules: ModuleMap,
  ): Promise<ModuleMap> {
    const { authDirectory, srcDirectory } = context.serverDirectories;
    const authEntityName = context.resourceInfo?.settings.authEntityName;
    if (!authEntityName) {
      context.logger.error("Failed to find the auth entity");
      throw new Error("The auth entity name has not been set");
    }
    const settings = utils.getPluginSettings(context.pluginInstallations);
    await createSupertokensService(
      settings.recipe,
      authDirectory,
      srcDirectory,
      authEntityName,
      modules,
      eventParams.dtos[authEntityName].createInput,
      settings.supertokensIdFieldName,
      context.logger,
    );
    await createAuthService(
      modules,
      srcDirectory,
      authDirectory,
      authEntityName,
      context.logger,
    );

    return modules;
  }

  async afterCreateEntityModule(
    context: DsgContext,
    eventParams: CreateEntityModuleParams,
    modules: ModuleMap,
  ): Promise<ModuleMap> {
    const { srcDirectory, authDirectory } = context.serverDirectories;
    const authEntityName = context.resourceInfo?.settings.authEntityName;
    if (!authEntityName) {
      context.logger.error("Failed to find the auth entity");
      throw new Error("Failed to find the authEntityName in the settings");
    }

    if (eventParams.entityName === camelCase(authEntityName)) {
      await addAuthModuleInAuthDir(
        eventParams,
        modules,
        srcDirectory,
        authDirectory,
        context.logger,
      );
      checks.addedAuthModuleInAuthDir = true;
    }

    return modules;
  }

  beforeCreateServer(
    context: DsgContext,
    eventParams: CreateServerParams,
  ): CreateServerParams {
    const authEntityName = context.resourceInfo?.settings.authEntityName;
    const settings = utils.getPluginSettings(context.pluginInstallations);
    verifyAuthCorePluginIsInstalled(
      context.pluginInstallations,
      context.logger,
    );
    verifySupertokensIdFieldExists(
      context.entities ?? [],
      authEntityName ?? "",
      settings.supertokensIdFieldName,
    );

    return eventParams;
  }

  async afterCreateServer(
    context: DsgContext,
    eventParams: CreateServerParams,
    modules: ModuleMap,
  ): Promise<ModuleMap> {
    const { srcDirectory } = context.serverDirectories;
    // Because the default cors setting doesn't work with the supertokens
    // cors setting
    removeRemoveDefaultCorsSettingInMain(srcDirectory, modules, context.logger);

    if (!checks.addedAuthModuleInAuthDir) {
      throw new Error("Failed to add the auth module to the auth directory");
    }
    if (!checks.alteredAuthEntityController) {
      throw new Error("Failed to alter the entity controller template");
    }
    if (!checks.alteredAuthEntityControllerBase) {
      throw new Error("Failed to alter the entity controller base template");
    }
    if (context.resourceInfo?.settings.serverSettings.generateGraphQL) {
      if (!checks.alteredAuthEntityResolver) {
        throw new Error("Failed to replace the auth entity resolver template");
      }
      if (!checks.alteredAuthEntityResolverBase) {
        throw new Error(
          "Failed to replace the auth entity resolver base template",
        );
      }
    }

    return modules;
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams,
  ): CreateServerDotEnvParams {
    const settings = utils.getPluginSettings(context.pluginInstallations);
    context.logger.info("Adding environment variables");
    eventParams.envVariables.push(...utils.settingsToVarDict(settings));

    return eventParams;
  }

  beforeCreateServerAppModule(
    context: DsgContext,
    eventParams: CreateServerAppModuleParams,
  ): CreateServerAppModuleParams {
    const { template } = eventParams;

    context.logger.info(
      "Adding the generateSupertokensOptions import to the app module",
    );
    addGenSupertokensOptionsImport(template);

    return eventParams;
  }

  async afterCreateServerAppModule(
    context: DsgContext,
    eventParams: CreateServerAppModuleParams,
    modules: ModuleMap,
  ): Promise<ModuleMap> {
    const { srcDirectory } = context.serverDirectories;
    const appModulePath = `${srcDirectory}/app.module.ts`;
    const appModule = modules.get(appModulePath);

    if (!appModule) {
      throw new Error("Failed to find the app module");
    }

    const newModules = new ModuleMap(context.logger);
    const unneededInSrc = [
      join("tests", "auth", "constants.ts"),
      "constants.ts",
    ];
    for (const module of modules.modules()) {
      if (unneededInSrc.includes(join(srcDirectory, module.path))) {
        continue;
      }
      newModules.set(module);
    }

    alterGraphqlSettingsInAppModule(newModules, appModule, context.logger);

    return newModules;
  }

  beforeCreateConnectMicroservices(
    context: DsgContext,
    eventParams: CreateConnectMicroservicesParams,
  ): CreateConnectMicroservicesParams {
    const { template } = eventParams;

    const connectFunc = utils.getFunctionDeclarationById(
      template,
      builders.identifier("connectMicroservices"),
    );
    context.logger.info(
      "Adding the cors and auth filter settings in the connectMicroservices function",
    );
    addAppCorsSettings(template, connectFunc);
    addAuthFilter(template, connectFunc);

    return eventParams;
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams,
  ): CreateServerPackageJsonParams {
    const supertokensDeps = constants.dependencies;

    context.logger.info(
      "Adding dependencies to the server's package.json file",
    );
    eventParams.updateProperties.forEach((updateProperty) => {
      merge(updateProperty, supertokensDeps);
    });

    return eventParams;
  }

  async afterCreateServerAuth(
    context: DsgContext,
    eventParams: CreateServerAuthParams,
    modules: ModuleMap,
  ): Promise<ModuleMap> {
    const newModules = await addRemoveAuthFiles(context, modules);
    return newModules;
  }
}

export default SupertokensAuthPlugin;
