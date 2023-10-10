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
  CreateSeedParams
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { appendImports } from "@amplication/code-gen-utils";
import { camelCase, merge } from "lodash";
import { join } from "path";
import { builders, namedTypes } from "ast-types";
import * as utils from "./utils";
import * as constants from "./constants";
import {
  addRemoveAuthFiles,
  alterGraphqlSettingsInAppModule,
  removeRemoveDefaultCorsSettingInMain,
  addSupertokensIdFieldToAuthEntity,
  addAuthModuleInAuthDir,
  makeSTIdFieldOptionalInCreation,
  removeSTIdFromUpdateInput,
  injectAuthService,
  createSupertokensService,
  createAuthService,
  verifyAuthCorePluginIsInstalled,
  verifyEmailAndPasswordFieldsExist,
  alterAuthControllerBaseMethods,
  alterAuthResolverBaseMethods,
  removeEmailUsernamePhoneNumberPasswordField,
  addEmailPropertyToDTO,
  addPhoneNumberPropertyToDTO,
  addThirdPartyIdPropertyToDTO,
  alterSeedData,
  replaceCustomSeedTemplate,
  alterSeedCode,
  addPasswordPropertyToDTO
} from "./core";

export const checks = {
  // Used to check if the auth module has been successfully added
  // after the server creation
  addedAuthModuleInAuthDir: false,
  replacedEntityController: false,
  replacedEntityControllerBase: false,
  replacedEntityResolver: false,
  replacedEntityResolverBase: false
}

class SupertokensAuthPlugin implements AmplicationPlugin {
  
  register(): Events {
    return {
      [EventNames.CreateServerAuth]: {
        after: this.afterCreateServerAuth
      },
      [EventNames.CreateServerPackageJson]: {
        before: this.beforeCreateServerPackageJson
      },
      [EventNames.CreateConnectMicroservices]: {
        before: this.beforeCreateConnectMicroservices
      },
      [EventNames.CreateServerAppModule]: {
        before: this.beforeCreateServerAppModule,
        after: this.afterCreateServerAppModule,
      },
      [EventNames.CreateServerDotEnv]: {
        before: this.beforeCreateServerDotEnv
      },
      [EventNames.CreateServer]: {
        before: this.beforeCreateServer,
        after: this.afterCreateServer
      },
      [EventNames.CreateEntityModule]: {
        after: this.afterCreateEntityModule
      },
      [EventNames.CreateDTOs]: {
        before: this.beforeCreateDTOs,
        after: this.afterCreateDTOs
      },
      [EventNames.CreateEntityController]: {
        before: this.beforeCreateEntityController
      },
      [EventNames.CreateEntityControllerBase]: {
        before: this.beforeCreateEntityControllerBase
      },
      [EventNames.CreateEntityResolver]: {
        before: this.beforeCreateEntityResolver
      },
      [EventNames.CreateEntityResolverBase]: {
        before: this.beforeCreateEntityResolverBase
      },
      [EventNames.CreateSeed]: {
        before: this.beforeCreateSeed,
        after: this.afterCreateSeed
      }
    };
  }

  beforeCreateSeed(
    context: DsgContext,
    eventParams: CreateSeedParams
  ): CreateSeedParams {

    const settings = utils.getPluginSettings(context.pluginInstallations);
    switch(settings.recipe.name) {
      case "passwordless":
      case "thirdparty":
      case "thirdpartyemailpassword":
      case "thirdpartypasswordless":
      case "phonepassword":
        alterSeedData(eventParams);
    }

    return eventParams;
  }

  async afterCreateSeed(
    context: DsgContext,
    eventParams: CreateSeedParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const { scriptsDirectory } = context.serverDirectories;
    const settings = utils.getPluginSettings(context.pluginInstallations);
    switch(settings.recipe.name) {
      case "passwordless":
      case "thirdparty":
      case "thirdpartyemailpassword":
      case "thirdpartypasswordless":
      case "phonepassword":
        alterSeedCode(scriptsDirectory, modules);
    }

    return modules;
  }

  async beforeCreateEntityResolver(
    context: DsgContext,
    eventParams: CreateEntityResolverParams
  ): Promise<CreateEntityResolverParams> {

    const authEntityName = context.resourceInfo?.settings.authEntityName;
    if(camelCase(authEntityName ?? "") === eventParams.entityName) {
      await injectAuthService(eventParams.template, 1);
      checks.replacedEntityResolver = true;
    }
    return eventParams;
  }

  async beforeCreateEntityResolverBase(
    context: DsgContext,
    eventParams: CreateEntityResolverBaseParams
  ): Promise<CreateEntityResolverBaseParams> {

    const settings = utils.getPluginSettings(context.pluginInstallations);
    const authEntityName = context.resourceInfo?.settings.authEntityName;
    if(camelCase(authEntityName ?? "") === eventParams.entityName) {
      await injectAuthService(eventParams.template, 2);
      alterAuthResolverBaseMethods(eventParams, settings);
      checks.replacedEntityResolverBase = true;
    }
    return eventParams
  }

  async beforeCreateEntityController(
    context: DsgContext,
    eventParams: CreateEntityControllerParams
  ): Promise<CreateEntityControllerParams> {

    const authEntityName = context.resourceInfo?.settings.authEntityName;
    if(camelCase(authEntityName ?? "") === eventParams.entityName) {
      await injectAuthService(eventParams.template, 1);
      checks.replacedEntityController = true;
    }
    return eventParams;
  }

  async beforeCreateEntityControllerBase(
    context: DsgContext,
    eventParams: CreateEntityControllerBaseParams
  ): Promise<CreateEntityControllerBaseParams> {

    const settings = utils.getPluginSettings(context.pluginInstallations);
    const authEntityName = context.resourceInfo?.settings.authEntityName;
    if(!authEntityName) {
      throw new Error("Failed to find the auth entity name");
    }
    if(camelCase(authEntityName ?? "") === eventParams.entityName) {
      injectAuthService(eventParams.template, 2);
      alterAuthControllerBaseMethods(eventParams, settings);
      checks.replacedEntityControllerBase = true;
    }
    return eventParams
  }

  beforeCreateDTOs(
    context: DsgContext,
    eventParams: CreateDTOsParams
  ): CreateDTOsParams {

    const authEntityName = context.resourceInfo?.settings.authEntityName;
    if(!authEntityName) {
      throw new Error("Failed to find the auth entity name");
    }
    const settings = utils.getPluginSettings(context.pluginInstallations);
    const dtos = eventParams.dtos[authEntityName];
    makeSTIdFieldOptionalInCreation(dtos.createInput);
    removeSTIdFromUpdateInput(dtos.updateInput);
    if(settings.recipe.name === "passwordless") {
      addEmailPropertyToDTO(dtos.createInput);
      addEmailPropertyToDTO(dtos.updateInput);
      addPhoneNumberPropertyToDTO(dtos.createInput)
      addPhoneNumberPropertyToDTO(dtos.updateInput);
    } else if(settings.recipe.name === "thirdparty") {
      addEmailPropertyToDTO(dtos.createInput);
      addEmailPropertyToDTO(dtos.updateInput);
      addThirdPartyIdPropertyToDTO(dtos.createInput);
      addThirdPartyIdPropertyToDTO(dtos.updateInput);
    } else if(settings.recipe.name === "thirdpartyemailpassword") {
      addEmailPropertyToDTO(dtos.createInput);
      addEmailPropertyToDTO(dtos.updateInput);
      addThirdPartyIdPropertyToDTO(dtos.createInput);
      addThirdPartyIdPropertyToDTO(dtos.updateInput);
      addPasswordPropertyToDTO(dtos.createInput);
      addPasswordPropertyToDTO(dtos.updateInput);
    } else if(settings.recipe.name === "thirdpartypasswordless") {
      addEmailPropertyToDTO(dtos.createInput);
      addEmailPropertyToDTO(dtos.updateInput);
      addThirdPartyIdPropertyToDTO(dtos.createInput);
      addThirdPartyIdPropertyToDTO(dtos.updateInput);
      addPhoneNumberPropertyToDTO(dtos.createInput);
      addPhoneNumberPropertyToDTO(dtos.updateInput);
    } else if(settings.recipe.name === "phonepassword") {
      addPhoneNumberPropertyToDTO(dtos.createInput);
      addPhoneNumberPropertyToDTO(dtos.updateInput);
      addPasswordPropertyToDTO(dtos.createInput);
      addPasswordPropertyToDTO(dtos.updateInput);
    }

    return eventParams;
  }

  async afterCreateDTOs(
    context: DsgContext,
    eventParams: CreateDTOsParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {

    const { authDirectory, srcDirectory } = context.serverDirectories;
    const authEntityName = context.resourceInfo?.settings.authEntityName;
    if(!authEntityName) {
      throw new Error("The auth entity name has not been set");
    }
    const settings = utils.getPluginSettings(context.pluginInstallations);
    await createSupertokensService(settings.recipe, authDirectory, srcDirectory, authEntityName, modules, 
      eventParams.dtos[authEntityName].createInput);
    await createAuthService(modules, srcDirectory, authDirectory, authEntityName);

    return modules;
  }

  async afterCreateEntityModule(
    context: DsgContext,
    eventParams: CreateEntityModuleParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {

    const { srcDirectory, authDirectory } = context.serverDirectories;
    const authEntityName = context.resourceInfo?.settings.authEntityName;
    if(!authEntityName) {
      throw new Error("Failed to find the authEntityName in the settings");
    }

    if(eventParams.entityName === camelCase(authEntityName)) {
      await addAuthModuleInAuthDir(eventParams, modules, srcDirectory, authDirectory);
      checks.addedAuthModuleInAuthDir = true;
    }

    return modules;
  }

  beforeCreateServer(
    context: DsgContext,
    eventParams: CreateServerParams
  ): CreateServerParams {

    const authEntityName = context.resourceInfo?.settings.authEntityName;
    const settings = utils.getPluginSettings(context.pluginInstallations);
    verifyAuthCorePluginIsInstalled(context.pluginInstallations);
    if(settings.recipe.name === "emailpassword") {
      verifyEmailAndPasswordFieldsExist(
        context.entities?.find((e) => e.name === authEntityName),
        settings.recipe.emailFieldName,
        settings.recipe.passwordFieldName
      );
    } else if(settings.recipe.name === "passwordless"
      || settings.recipe.name === "thirdparty"
      || settings.recipe.name === "thirdpartyemailpassword"
      || settings.recipe.name === "thirdpartypasswordless"
      || settings.recipe.name === "phonepassword") {
      removeEmailUsernamePhoneNumberPasswordField(context)
    }
    addSupertokensIdFieldToAuthEntity(context);

    return eventParams;
  }

  async afterCreateServer(
    context: DsgContext,
    eventParams: CreateServerParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const { srcDirectory } = context.serverDirectories;
    // Because the default cors setting doesn't work with the supertokens
    // cors setting
    removeRemoveDefaultCorsSettingInMain(srcDirectory, modules);

    if(!checks.addedAuthModuleInAuthDir) {
      throw new Error("Failed to add the auth module to the auth directory");
    }
    if(!checks.replacedEntityController) {
      throw new Error("Failed to replace the entity controller template");
    }
    if(!checks.replacedEntityControllerBase) {
      throw new Error("Failed to replace the entity controller base template");
    }
    if(context.resourceInfo?.settings.serverSettings.generateGraphQL) {
      if(!checks.replacedEntityResolver) {
        throw new Error("Failed to replace the auth entity resolver template");
      }
      if(!checks.replacedEntityResolverBase) {
        throw new Error("Failed to replace the auth entity resolver base template");
      }
    }

    return modules;
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams
  ): CreateServerDotEnvParams {

    const settings = utils.getPluginSettings(context.pluginInstallations);
    eventParams.envVariables.push(...utils.settingsToVarDict(settings));

    return eventParams
  }

  beforeCreateServerAppModule(
    context: DsgContext,
    eventParams: CreateServerAppModuleParams
  ): CreateServerAppModuleParams {
    const { template } = eventParams;

    appendImports(template, [
      genSupertokensOptionsImport()
    ])

    return eventParams
  }

  async afterCreateServerAppModule(
    context: DsgContext,
    eventParams: CreateServerAppModuleParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    
    const { srcDirectory } = context.serverDirectories;
    const appModulePath = `${srcDirectory}/app.module.ts`;
    const appModule = modules.get(appModulePath);
    
    if(!appModule) {
      throw new Error("Failed to find the app module");
    }

    const newModules = new ModuleMap(context.logger);
    const unneededInSrc = [
      join("tests", "auth", "constants.ts"),
      "constants.ts"
    ];
    for(const module of modules.modules()) {
      if(unneededInSrc.includes(join(srcDirectory, module.path))) {
        continue;
      }
      newModules.set(module);
    }

    alterGraphqlSettingsInAppModule(newModules, appModule);

    return newModules;
  }

  beforeCreateConnectMicroservices(
    context: DsgContext,
    eventParams: CreateConnectMicroservicesParams
  ): CreateConnectMicroservicesParams {
    const { template } = eventParams;

    appendImports(template, [
      supertokensImport(),
      authFilterImport(),
      genSupertokensOptionsImport()
    ]);

    const connectFunc = utils.getFunctionDeclarationById(
      template,
      builders.identifier("connectMicroservices")
    );
    connectFunc.body.body.push(enableCorsStatement(), globalFiltersStatement());

    return eventParams;
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams
  ): CreateServerPackageJsonParams {
    const supertokensDeps = constants.dependencies

    eventParams.updateProperties.forEach((updateProperty) => {
      merge(updateProperty, supertokensDeps);
    });

    return eventParams;
  }

  async afterCreateServerAuth(
    context: DsgContext,
    eventParams: CreateServerAuthParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const newModules = await addRemoveAuthFiles(context, modules);

    const settings = utils.getPluginSettings(context.pluginInstallations);
    const { scriptsDirectory } = context.serverDirectories;
    const authEntity = context.entities?.find(
      (x) => x.name === context.resourceInfo?.settings.authEntityName
    );
    if(!authEntity) {
      throw new Error("Failed to find the auth entity");
    }
    switch(settings.recipe.name) {
      case "passwordless":
      case "thirdparty":
      case "thirdpartyemailpassword":
      case "thirdpartypasswordless":
      case "phonepassword":
        await replaceCustomSeedTemplate(
          scriptsDirectory,
          authEntity,
          newModules
        );
    }
    return newModules;
  }
}

const supertokensImport = (): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importDefaultSpecifier(builders.identifier("supertokens"))],
    builders.stringLiteral("supertokens-node")
  )
}

const authFilterImport = (): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importSpecifier(builders.identifier("STAuthFilter"))],
    builders.stringLiteral("./auth/supertokens/auth.filter")
  )
}

const genSupertokensOptionsImport = (): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importSpecifier(builders.identifier("generateSupertokensOptions"))],
    builders.stringLiteral("./auth/supertokens/generateSupertokensOptions")
  )
}

const globalFiltersStatement = (): namedTypes.ExpressionStatement => {
  return builders.expressionStatement(
    appCallExpression("useGlobalFilters", [
      builders.newExpression(builders.identifier("STAuthFilter"), [])
    ])
  );
}

const enableCorsStatement = (): namedTypes.ExpressionStatement => {
  return builders.expressionStatement(appCallExpression(
    "enableCors",
    [
      builders.objectExpression([
        allowOriginWebsiteDomainProp(),
        allowedSupertokenHeadersProp(),
        builders.objectProperty(
          builders.identifier("credentials"),
          builders.booleanLiteral(true)
        )
      ])
    ]
  ))
}

const allowedSupertokenHeadersProp = (): namedTypes.ObjectProperty => {
  return builders.objectProperty(
    builders.identifier("allowedHeaders"),
    builders.arrayExpression([
      builders.stringLiteral("content-type"),
      builders.spreadElement(builders.callExpression(
        builders.memberExpression(
          builders.identifier("supertokens"),
          builders.identifier("getAllCORSHeaders")
        ),
        []
      ))
    ])
  )
}

const allowOriginWebsiteDomainProp = (): namedTypes.ObjectProperty => {
  return builders.objectProperty(
    builders.identifier("origin"),
    builders.arrayExpression([
      builders.memberExpression(
        builders.memberExpression(
          builders.callExpression(
            builders.identifier("generateSupertokensOptions"),
            [builders.identifier("configService")]
          ),
          builders.identifier("appInfo")
        ),
        builders.identifier("websiteDomain")
      )
    ])
  )
}

const appCallExpression = (
  funcName: string,
  params: namedTypes.CallExpression["arguments"]
): namedTypes.CallExpression => {
  return builders.callExpression(
    builders.memberExpression(
      builders.identifier("app"),
      builders.identifier(funcName)
    ),
    params
  )
}

export default SupertokensAuthPlugin;
