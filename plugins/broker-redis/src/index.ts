import type {
  AmplicationPlugin,
  CreateAdminUIParams,
  CreateMessageBrokerParams,
  CreateServerAppModuleParams,
  CreateConnectMicroservicesParams,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { builders, namedTypes } from "ast-types";
import { join } from "path";
import * as utils from "./utils"

class RedisBrokerPlugin implements AmplicationPlugin {
  
  register(): Events {
    return {
      [EventNames.CreateServerAppModule]: {
        before: this.beforeCreateServerAppModule
      },
      [EventNames.CreateMessageBroker]: {
        before: this.beforeCreateBroker
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

  beforeCreateBroker(
    dsgContext: DsgContext,
    eventParams: CreateMessageBrokerParams
  ): CreateMessageBrokerParams {
    dsgContext.serverDirectories.messageBrokerDirectory = join(
      dsgContext.serverDirectories.srcDirectory,
      "redis"
    );
    return eventParams;
  }

  beforeCreateConnectMicroservices(
    context: DsgContext,
    eventParams: CreateConnectMicroservicesParams
  ): CreateConnectMicroservicesParams {
    const { template } = eventParams;

    utils.addImport(template, microserviceOptionsImport());
    utils.addImport(template, genRedisClientOptsImport());

    const connectFunc = utils.getFunctionDeclarationById(
      template,
      builders.identifier("connectMicroservices")
    );
    connectFunc.body.body.push(connectRedisMicroserviceExpr());

    return eventParams;
  }
}

const redisModuleImport = (redisModuleName: string): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(redisModuleName))],
    builders.stringLiteral("./redis/redis.module")
  );
}

const microserviceOptionsImport = (): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importSpecifier(builders.identifier("MicroserviceOptions"))],
    builders.stringLiteral("@nestjs/microservices")
  )
}

const genRedisClientOptsImport = (): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importSpecifier(builders.identifier("generateRedisClientOptions"))],
    builders.stringLiteral("./redis/generateRedisClientOptions")
  )
}

const connectRedisMicroserviceExpr = (): namedTypes.ExpressionStatement => {
  const typeArgs = builders.tsTypeParameterInstantiation([
    builders.tsTypeReference(builders.identifier("MicroserviceOptions"))
  ]);
  const expr = builders.callExpression(appConnectMicroserviceObj(), [genRedisClientOptsInvocation()]);
  expr.typeArguments = typeArgs as unknown as namedTypes.TypeParameterInstantiation;
  return builders.expressionStatement(expr);
}

const appConnectMicroserviceObj = (): namedTypes.MemberExpression => {
  return builders.memberExpression(
    builders.identifier("app"),
    builders.identifier("connectMicroservice")
  );
}

const genRedisClientOptsInvocation = (): namedTypes.CallExpression => {
  return builders.callExpression(
    builders.identifier("generateRedisClientOptions"),
    [builders.identifier("configService")]
  );
}

export default RedisBrokerPlugin
