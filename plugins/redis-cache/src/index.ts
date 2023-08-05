import type {
  AmplicationPlugin,
  CreateServerAppModuleParams,
  CreateServerDockerComposeParams,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  DsgContext,
  Events
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { merge } from "lodash"
import * as utils from "./utils"
import { builders, namedTypes } from "ast-types"
import * as constants from "./constants"



class RedisCachePlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServerPackageJson]: {
        before: this.beforeCreateServerPackageJson
      },
      [EventNames.CreateServerAppModule]: {
        before: this.beforeCreateServerAppModule
      },
      [EventNames.CreateServerDotEnv]: {
        before: this.beforeCreateServerDotEnv
      },
      [EventNames.CreateServerDockerCompose]: {
        before: this.beforeCreateServerDockerCompose
      }
    };
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams
  ): CreateServerPackageJsonParams {
    const redisDeps = constants.dependencies

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

    utils.addImport(template, stmt('import { CacheModule } from "@nestjs/common";'))
    utils.addImport(template, stmt('import * as redisStore from "cache-manager-redis-store"'))

    if(!templateMapping["MODULES"]) {
      throw new Error("Failed to find the app module's imported modules")
    }

    const modules = templateMapping.MODULES as namedTypes.ArrayExpression;
    const cacheModule = cacheModuleInstantiation()

    modules.elements.push(cacheModule)

    return eventParams
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams
  ): CreateServerDotEnvParams {

    const settings = utils.getPluginSettings(context.pluginInstallations)
    eventParams.envVariables = utils.settingsToVarDict(settings)

    return eventParams
  }

  beforeCreateServerDockerCompose(
    context: DsgContext,
    eventParams: CreateServerDockerComposeParams
  ): CreateServerDockerComposeParams {

    eventParams.updateProperties.push(...constants.updateDockerComposeProperties)

    return eventParams;
  }
}

const stmt = (stmt: string): any => {
  return utils.parse(stmt).program.body[0]
}

const cacheModuleInstantiation = () => {
  return builders.callExpression(
    builders.memberExpression(
      builders.identifier("CacheModule"),
      builders.identifier("register")
    ),
    [
      builders.objectExpression([
        objProp("isGlobal", builders.booleanLiteral(true)),
        objProp("store", builders.identifier("redisStore")),
        objProp("host", envVar("REDIS_HOST")),
        objProp("port", envVar("REDIS_PORT")),
        objProp("username", envVar("REDIS_USERNAME")),
        objProp("password", envVar("REDIS_PASSWORD")),
        objProp("ttl", parseIntOr(envVar("REDIS_TTL"), "5")),
        objProp("max", parseIntOr(envVar("REDIS_MAX_REQUESTS_CACHED"), "100"))
      ]),
    ]
  );
}

const parseIntOr = (val: namedTypes.MemberExpression, defaultVal: string) => {
  return builders.callExpression(
    builders.identifier("parseInt"),
    [
      builders.conditionalExpression(
        val,
        val,
        builders.stringLiteral(defaultVal)
      )
    ]
  )
}

const objProp = (key: string, val: any): namedTypes.ObjectProperty => {
  return builders.objectProperty(
    builders.identifier(key),
    val
  )
}

const envVar = (variable: string): namedTypes.MemberExpression => {
  return builders.memberExpression(
    builders.memberExpression(
      builders.identifier("process"),
      builders.identifier("env")
    ),
    builders.identifier(variable)
  )
}

export default RedisCachePlugin;
