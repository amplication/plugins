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
  Module,
  ModuleMap,
  CreateEntityControllerParams,
  CreateEntityControllerBaseParams,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { appendImports, readFile } from "@amplication/code-gen-utils";
import { merge } from "lodash";
import { builders, namedTypes } from "ast-types";
import { resolve } from "path";
import * as utils from "./utils";
import * as constants from "./constants";
import {
  addSupertokensFiles,
  alterGraphqlSettingsInAppModule,
  removeRemoveDefaultCorsSettingInMain,
  addSupertokensIdFieldToAuthEntity,
  addAuthModuleInAuthDir,
  makeSTIdFieldOptionalInCreation,
  removeSTIdFromUpdateInput,
  replaceEntityControllerBaseTemplate,
  replaceEntityControllerTemplate
} from "./core";

class SupertokensAuthPlugin implements AmplicationPlugin {
  // Used to check if the auth module has been successfully added
  // after the server creation
  addedAuthModuleInAuthDir = false;
  replacedEntityController = false;
  replacedEntityControllerBase = false;
  
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
        before: this.beforeCreateDTOs
      },
      [EventNames.CreateEntityController]: {
        before: this.beforeCreateEntityController
      },
      [EventNames.CreateEntityControllerBase]: {
        before: this.beforeCreateEntityControllerBase
      }
    };
  }

  async beforeCreateEntityController(
    context: DsgContext,
    eventParams: CreateEntityControllerParams
  ): Promise<CreateEntityControllerParams> {

    if(context.resourceInfo?.settings.authEntityName === eventParams.entityName) {
      await replaceEntityControllerTemplate(eventParams);
      this.replacedEntityController = true;
    }
    return eventParams;
  }

  async beforeCreateEntityControllerBase(
    context: DsgContext,
    eventParams: CreateEntityControllerBaseParams
  ): Promise<CreateEntityControllerBaseParams> {

    const settings = utils.getPluginSettings(context.pluginInstallations);
    if(context.resourceInfo?.settings.authEntityName === eventParams.entityName) {
      await replaceEntityControllerBaseTemplate(eventParams, context.entities, settings);
      this.replacedEntityControllerBase = true;
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
    
    makeSTIdFieldOptionalInCreation(eventParams.dtos[authEntityName].createInput);
    removeSTIdFromUpdateInput(eventParams.dtos[authEntityName].updateInput);

    return eventParams;
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

    if(eventParams.entityName === authEntityName) {
      await addAuthModuleInAuthDir(eventParams, modules, srcDirectory, authDirectory);
      this.addedAuthModuleInAuthDir = true;
    }

    return modules;
  }

  beforeCreateServer(
    context: DsgContext,
    eventParams: CreateServerParams
  ): CreateServerParams {

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
      "tests/auth/constants.ts",
      "constants.ts"
    ];
    for(const module of modules.modules()) {
      if(unneededInSrc.includes(`${srcDirectory}/${module.path}`)) {
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
    const newModules = await addSupertokensFiles(context, modules);
  
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
    [builders.importSpecifier(builders.identifier("AuthFilter"))],
    builders.stringLiteral("./auth/auth.filter")
  )
}

const genSupertokensOptionsImport = (): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importSpecifier(builders.identifier("generateSupertokensOptions"))],
    builders.stringLiteral("./auth/generateSupertokensOptions")
  )
}

const globalFiltersStatement = (): namedTypes.ExpressionStatement => {
  return builders.expressionStatement(
    appCallExpression("useGlobalFilters", [
      builders.newExpression(builders.identifier("AuthFilter"), [])
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
