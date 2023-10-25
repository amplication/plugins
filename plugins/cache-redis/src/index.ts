import type {
  AmplicationPlugin,
  CreateServerAppModuleParams,
  CreateServerDockerComposeDevParams,
  CreateServerDockerComposeParams,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  DsgContext,
  Events,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { merge } from "lodash";
import * as utils from "./utils";
import { builders, namedTypes } from "ast-types";
import * as constants from "./constants";

class RedisCachePlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServerPackageJson]: {
        before: this.beforeCreateServerPackageJson,
      },
      [EventNames.CreateServerAppModule]: {
        before: this.beforeCreateServerAppModule,
      },
      [EventNames.CreateServerDotEnv]: {
        before: this.beforeCreateServerDotEnv,
      },
      [EventNames.CreateServerDockerCompose]: {
        before: this.beforeCreateServerDockerCompose,
      },
      [EventNames.CreateServerDockerComposeDev]: {
        before: this.beforeCreateServerDockerComposeDev,
      },
    };
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams
  ): CreateServerPackageJsonParams {
    const redisDeps = constants.dependencies;

    eventParams.updateProperties.forEach((updateProperty) => {
      merge(updateProperty, redisDeps);
    });

    return eventParams;
  }

  beforeCreateServerAppModule(
    context: DsgContext,
    eventParams: CreateServerAppModuleParams
  ): CreateServerAppModuleParams {
    const { template, templateMapping } = eventParams;

    utils.addImport(template, cacheModuleImport());
    utils.addImport(template, redisStoreImport());

    if (!templateMapping["MODULES"]) {
      throw new Error("Failed to find the app module's imported modules");
    }

    const modules = templateMapping.MODULES as namedTypes.ArrayExpression;
    const cacheModule = cacheModuleInstantiation();

    modules.elements.push(cacheModule);

    return eventParams;
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams
  ): CreateServerDotEnvParams {
    const settings = utils.getPluginSettings(context.pluginInstallations);
    eventParams.envVariables.push(...utils.settingsToVarDict(settings));

    return eventParams;
  }

  beforeCreateServerDockerCompose(
    context: DsgContext,
    eventParams: CreateServerDockerComposeParams
  ): CreateServerDockerComposeParams {
    eventParams.updateProperties.push(
      ...constants.updateDockerComposeProperties
    );

    return eventParams;
  }

  beforeCreateServerDockerComposeDev(
    context: DsgContext,
    eventParams: CreateServerDockerComposeDevParams
  ): CreateServerDockerComposeParams {
    eventParams.updateProperties.push(
      ...constants.updateDockerComposeDevProperties
    );

    return eventParams;
  }
}

const cacheModuleImport = (): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importSpecifier(builders.identifier("CacheModule"))],
    builders.stringLiteral("@nestjs/cache-manager")
  );
};

const redisStoreImport = (): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importSpecifier(builders.identifier("redisStore"))],
    builders.stringLiteral("cache-manager-ioredis-yet")
  );
};

const cacheModuleInstantiation = () => {
  return builders.callExpression(
    builders.memberExpression(
      builders.identifier("CacheModule"),
      builders.identifier("registerAsync")
    ),
    [
      builders.objectExpression([
        objProp("isGlobal", builders.booleanLiteral(true)),
        objProp(
          "imports",
          builders.arrayExpression([builders.identifier("ConfigModule")])
        ),
        objProp("useFactory", useFactoryConfigFunc()),
        objProp(
          "inject",
          builders.arrayExpression([builders.identifier("ConfigService")])
        ),
      ]),
    ]
  );
};

const useFactoryConfigFunc = (): namedTypes.ArrowFunctionExpression => {
  const factoryConfigFuncArgs = [
    builders.identifier.from({
      name: "configService",
      typeAnnotation: builders.tsTypeAnnotation(
        builders.tsTypeReference(builders.identifier("ConfigService"))
      ),
    }),
  ];
  const redisStoreArgs = [
    builders.objectExpression([
      objProp("host", builders.identifier("host")),
      objProp("port", builders.identifier("port")),
      objProp("username", builders.identifier("username")),
      objProp("password", builders.identifier("password")),
      objProp("ttl", builders.identifier("ttl")),
    ]),
  ];

  const factoryConfigFunc = builders.arrowFunctionExpression(
    factoryConfigFuncArgs,
    builders.blockStatement([
      configAssign("host", "REDIS_HOST"),
      configAssign("port", "REDIS_PORT"),
      configAssign("username", "REDIS_USERNAME"),
      configAssign("password", "REDIS_PASSWORD"),
      configAssign("ttl", "REDIS_TTL", builders.literal(5000)),
      builders.returnStatement(
        builders.objectExpression([
          objProp(
            "store",
            builders.awaitExpression(
              builders.callExpression(
                builders.identifier("redisStore"),
                redisStoreArgs
              )
            )
          ),
        ])
      ),
    ])
  );
  factoryConfigFunc.async = true;

  return factoryConfigFunc;
};

const configAssign = (
  name: string,
  key: string,
  ...others: any[]
): namedTypes.VariableDeclaration => {
  return builders.variableDeclaration("const", [
    builders.variableDeclarator(
      builders.identifier(name),
      builders.callExpression(
        builders.memberExpression(
          builders.identifier("configService"),
          builders.identifier("get")
        ),
        [builders.stringLiteral(key), ...others]
      )
    ),
  ]);
};

const objProp = (key: string, val: any): namedTypes.ObjectProperty => {
  return builders.objectProperty(builders.identifier(key), val);
};

export default RedisCachePlugin;
