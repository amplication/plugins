import type {
  AmplicationPlugin,
  CreateAdminUIParams,
  CreateServerAppModuleParams,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { builders, namedTypes } from "ast-types";
import * as utils from "./utils"

class RedisBrokerPlugin implements AmplicationPlugin {
  
  register(): Events {
    return {
      [EventNames.CreateServerAppModule]: {
        before: this.beforeCreateServerAppModule
      }
    };
  }
  
  beforeCreateServerAppModule(
    dsgContext: DsgContext,
    eventParams: CreateServerAppModuleParams
  ): CreateServerAppModuleParams {
    const { template, templateMapping } = eventParams;

    const redisModuleName = "RedisModule";
    utils.addImport(template, redisModuleImport(redisModuleName));

    if(!templateMapping.MODULES) {
      throw new Error("Failed to find the app module's imported modules");
    }

    const modules = templateMapping.MODULES as namedTypes.ArrayExpression;
    modules.elements.push(builders.identifier(redisModuleName));

    return eventParams;
  }
}

const redisModuleImport = (redisModuleName: string): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(redisModuleName))],
    builders.stringLiteral("./redis/redis.module")
  );
}

export default RedisBrokerPlugin
