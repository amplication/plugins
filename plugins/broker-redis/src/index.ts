import {
  AmplicationPlugin,
  CreateAdminUIParams,
  CreateMessageBrokerParams,
  CreateServerAppModuleParams,
  CreateConnectMicroservicesParams,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
  CreateServerPackageJsonParams,
  CreateMessageBrokerClientOptionsFactoryParams,
  CreateMessageBrokerNestJSModuleParams,
  CreateMessageBrokerServiceParams,
  CreateServerDockerComposeDevParams,
  CreateServerDockerComposeParams
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { builders, namedTypes } from "ast-types";
import { join, resolve } from "path";
import { merge } from "lodash"
import { readFile, print } from "@amplication/code-gen-utils";
import * as utils from "./utils"
import * as constants from "./constants"

class RedisBrokerPlugin implements AmplicationPlugin {
  
  register(): Events {
    return {
      [EventNames.CreateServerAppModule]: {
        before: this.beforeCreateServerAppModule
      },
      [EventNames.CreateMessageBroker]: {
        before: this.beforeCreateBroker
      },
      [EventNames.CreateConnectMicroservices]: {
        before: this.beforeCreateConnectMicroservices
      },
      [EventNames.CreateServerPackageJson]: {
        before: this.beforeCreateServerPackageJson
      },
      [EventNames.CreateMessageBrokerClientOptionsFactory]: {
        after: this.afterCreateMessageBrokerClientOptionsFactory
      },
      [EventNames.CreateMessageBrokerNestJSModule]: {
        after: this.afterCreateMessageBrokerNestJSModule
      },
      [EventNames.CreateMessageBrokerService]: {
        after: this.afterCreateMessageBrokerService
      },
      [EventNames.CreateServerDockerCompose]: {
        before: this.beforeCreateServerDockerCompose
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

  async afterCreateMessageBrokerClientOptionsFactory(
    context: DsgContext,
    eventParams: CreateMessageBrokerClientOptionsFactoryParams
  ): Promise<ModuleMap> {
    const filePath = resolve(constants.staticsPath, "generateRedisClientOptions.ts");
    const file = await readFile(filePath);
    const generateFileName = "generateRedisClientOptions.ts";

    const path = join(
      context.serverDirectories.messageBrokerDirectory,
      generateFileName
    );
    const modules = new ModuleMap(context.logger);
    await modules.set({ code: print(file).code, path });
    return modules;
  }

  async afterCreateMessageBrokerNestJSModule(
    context: DsgContext,
    eventParams: CreateMessageBrokerNestJSModuleParams
  ): Promise<ModuleMap> {
    const filePath = resolve(constants.staticsPath, "redis.module.ts");

    const file = await readFile(filePath);
    const generateFileName = "redis.module.ts";

    const modules = new ModuleMap(context.logger);
    await modules.set({
      code: print(file).code,
      path: join(context.serverDirectories.messageBrokerDirectory, generateFileName),
    });
    return modules;
  }

  async afterCreateMessageBrokerService(
    context: DsgContext,
    eventParams: CreateMessageBrokerServiceParams
  ): Promise<ModuleMap> {
    const filePath = resolve(constants.staticsPath, "redis.service.ts");

    const file = await readFile(filePath);
    const generateFileName = "redis.service.ts";

    const modules = new ModuleMap(context.logger);
    await modules.set({
      code: print(file).code,
      path: join(context.serverDirectories.messageBrokerDirectory, generateFileName),
    });
    return modules;
  }

  beforeCreateServerDockerCompose(
    context: DsgContext,
    eventParams: CreateServerDockerComposeParams
  ): CreateServerDockerComposeParams {

    eventParams.updateProperties.push(...constants.updateDockerComposeProperties)

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
