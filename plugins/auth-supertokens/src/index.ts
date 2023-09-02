import {
  AmplicationPlugin,
  CreateConnectMicroservicesParams,
  CreateServerAppModuleParams,
  CreateServerAuthParams,
  CreateServerPackageJsonParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { resolve, join } from "path";
import { readFile, print, appendImports } from "@amplication/code-gen-utils";
import { merge } from "lodash";
import { builders, namedTypes } from "ast-types";
import * as utils from "./utils";
import * as constants from "./constants";

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
        before: this.beforeCreateServerAppModule
      }
    };
  }

  beforeCreateServerAppModule(
    context: DsgContext,
    eventParams: CreateServerAppModuleParams
  ): CreateServerAppModuleParams {
    const { template, templateMapping } = eventParams;

    appendImports(template, [
      authModuleImport(),
      genSupertokensOptionsImport()
    ])

    if(!templateMapping["MODULES"]) {
      throw new Error("Failed to find the app module's imported modules")
    }

    const modules = templateMapping.MODULES as namedTypes.ArrayExpression;
    const authModule = authModuleInstantiation();

    modules.elements.push(authModule);

    return eventParams
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
    eventParams: CreateServerAuthParams
  ): Promise<ModuleMap> {
    const { serverDirectories, logger } = context;
    const fileNames = [
      "supertokens/supertokens.service.ts",
      "supertokens/supertokens.service.spec.ts",
      "auth.filter.ts",
      "auth.filter.spec.ts",
      "auth.guard.ts",
      "auth.guard.spec.ts",
      "auth.middleware.ts",
      "auth.middleware.spec.ts",
      "auth.module.ts",
      "config.interface.ts",
      "generateSupertokensOptions.ts",
      "recipes.ts",
      "session.decorator.ts"
    ];

    const modules = new ModuleMap(logger);
    for(const name of fileNames) {
      const filePath = resolve(constants.staticsPath, name);
      const file = await readFile(filePath);
      await modules.set({
        code: print(file).code,
        path: join(serverDirectories.authDirectory, name)
      });
    }

    return modules;
  }
}

const supertokensImport = (): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importDefaultSpecifier(builders.identifier("supertokens"))],
    builders.stringLiteral("supertokens-node")
  )
}

const authModuleImport = (): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importSpecifier(builders.identifier("AuthModule"))],
    builders.stringLiteral("./auth/auth.module")
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

const authModuleInstantiation = (): namedTypes.CallExpression => {
  return builders.callExpression(
    builders.memberExpression(
      builders.identifier("AuthModule"),
      builders.identifier("forRootAsync")
    ),
    [
      builders.objectExpression([
        builders.objectProperty(
          builders.identifier("useFactory"),
          builders.arrowFunctionExpression(
            [builders.identifier("configService")],
            builders.blockStatement([
              builders.returnStatement(builders.callExpression(
                builders.identifier("generateSupertokensOptions"),
                [builders.identifier("configService")]
              ))
            ])
          )
        )
      ])
    ]
  )
}

export default SupertokensAuthPlugin;
