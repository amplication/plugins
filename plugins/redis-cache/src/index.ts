import type {
  AmplicationPlugin,
  CreateServerAppModuleParams,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  DsgContext,
  Events
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { merge } from "lodash"
import * as utils from "./utils"
import { builders, namedTypes } from "ast-types"


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
      }
    };
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams
  ): CreateServerPackageJsonParams {
    const redisDeps = {
      dependencies: {
        "cache-manager": "3.6.3",
        "cache-manager-redis-store": "2.0.0",
        "@types/cache-manager": "3.4.3",
        "@types/cache-manager-redis-store": "2.0.1"
      }
    }

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
    [builders.objectExpression([
      builders.objectProperty(
        builders.identifier("isGlobal"),
        builders.booleanLiteral(true)
      )
    ])]
  );
}

export default RedisCachePlugin;
