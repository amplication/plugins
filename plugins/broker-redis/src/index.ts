import {
  AmplicationPlugin,
  CreateMessageBrokerParams,
  CreateServerAppModuleParams,
  CreateConnectMicroservicesParams,
  DsgContext,
  Events,
  ModuleMap,
  CreateServerPackageJsonParams,
  CreateMessageBrokerClientOptionsFactoryParams,
  CreateMessageBrokerNestJSModuleParams,
  CreateMessageBrokerServiceParams,
  CreateServerDockerComposeDevParams,
  CreateServerDockerComposeParams,
  CreateServerDotEnvParams,
  EnumMessagePatternConnectionOptions,
  CreateMessageBrokerTopicsEnumParams,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { builders, namedTypes } from "ast-types";
import { join, resolve } from "path";
import { merge } from "lodash";
import { readFile, print } from "@amplication/code-gen-utils";
import { pascalCase } from "pascal-case";
import * as utils from "./utils";
import * as constants from "./constants";
import { TSType } from "@babel/types";

class RedisBrokerPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServerAppModule]: {
        before: this.beforeCreateServerAppModule,
      },
      [EventNames.CreateMessageBroker]: {
        before: this.beforeCreateMessageBroker,
      },
      [EventNames.CreateConnectMicroservices]: {
        before: this.beforeCreateConnectMicroservices,
      },
      [EventNames.CreateServerPackageJson]: {
        before: this.beforeCreateServerPackageJson,
      },
      [EventNames.CreateMessageBrokerClientOptionsFactory]: {
        after: this.afterCreateMessageBrokerClientOptionsFactory,
      },
      [EventNames.CreateMessageBrokerNestJSModule]: {
        after: this.afterCreateMessageBrokerNestJSModule,
      },
      [EventNames.CreateMessageBrokerService]: {
        after: this.afterCreateMessageBrokerService,
      },
      [EventNames.CreateServerDockerCompose]: {
        before: this.beforeCreateServerDockerCompose,
      },
      [EventNames.CreateServerDockerComposeDev]: {
        before: this.beforeCreateServerDockerComposeDev,
      },
      [EventNames.CreateServerDotEnv]: {
        before: this.beforeCreateServerDotEnv,
      },
      [EventNames.CreateMessageBrokerTopicsEnum]: {
        after: this.afterCreateMessageBrokerTopicsEnum,
      },
    };
  }

  async afterCreateMessageBrokerTopicsEnum(
    context: DsgContext,
    eventParams: CreateMessageBrokerTopicsEnumParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const { serverDirectories } = context;
    const topicsPath = join(
      serverDirectories.messageBrokerDirectory,
      "topics.ts"
    );
    const topicsModule = modules.get(topicsPath);
    if (!topicsModule) {
      throw new Error(
        "Failed to find the topics.ts file for the message broker topics enum"
      );
    }

    const topicsFile = utils.parse(topicsModule.code);
    const topicEnumNames: string[] = [];
    topicsFile.program.body.forEach((stmt) => {
      if (stmt.type === "ExportNamedDeclaration") {
        if (
          !stmt.declaration ||
          //@ts-ignore
          !stmt.declaration.id ||
          //@ts-ignore
          !stmt.declaration.id.name
        ) {
          throw new Error(
            "Couldn't find the name of an enum in the message broker topics file"
          );
        }
        //@ts-ignore
        topicEnumNames.push(stmt.declaration.id.name);
      }
    });
    const umbrellaTypeDeclaration =
      allMessageBrokerTopicsTypeDeclaration(topicEnumNames);
    topicsFile.program.body.push(
      builders.emptyStatement(),
      umbrellaTypeDeclaration
    );

    await modules.set({
      code: print(topicsFile).code,
      path: topicsPath,
    });
    return modules;
  }

  beforeCreateServerAppModule(
    dsgContext: DsgContext,
    eventParams: CreateServerAppModuleParams
  ): CreateServerAppModuleParams {
    const { template, templateMapping } = eventParams;

    const redisModuleName = "RedisModule";
    utils.appendImports(template, [redisModuleImport(redisModuleName)]);

    if (!templateMapping.MODULES) {
      throw new Error("Failed to find the app module's imported modules");
    }

    const modules = templateMapping.MODULES as namedTypes.ArrayExpression;
    modules.elements.push(builders.identifier(redisModuleName));

    return eventParams;
  }

  beforeCreateMessageBroker(
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

    utils.appendImports(template, [
      microserviceOptionsImport(),
      genRedisClientOptsImport(),
    ]);

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
    const redisDeps = constants.dependencies;

    eventParams.updateProperties.forEach((updateProperty) => {
      merge(updateProperty, redisDeps);
    });

    return eventParams;
  }

  async afterCreateMessageBrokerClientOptionsFactory(
    context: DsgContext,
    eventParams: CreateMessageBrokerClientOptionsFactoryParams
  ): Promise<ModuleMap> {
    const filePath = resolve(
      constants.staticsPath,
      "generateRedisClientOptions.ts"
    );
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
      path: join(
        context.serverDirectories.messageBrokerDirectory,
        generateFileName
      ),
    });
    return modules;
  }

  async afterCreateMessageBrokerService(
    context: DsgContext,
    eventParams: CreateMessageBrokerServiceParams
  ): Promise<ModuleMap> {
    const { serverDirectories } = context;

    const modules = new ModuleMap(context.logger);

    for (const filename of [
      "redis.producer.service.ts",
      "constants.ts",
      "redisMessage.ts",
    ]) {
      const filepath = resolve(constants.staticsPath, filename);
      const code = await readFile(filepath);
      await modules.set({
        code: print(code).code,
        path: join(serverDirectories.messageBrokerDirectory, filename),
      });
    }

    const templatePath = join(
      constants.templatesPath,
      "controller.template.ts"
    );
    const template = await readFile(templatePath);
    const controllerId = builders.identifier("RedisController");
    utils.interpolate(template, { CONTROLLER: controllerId });
    const controllerClass = utils.getClassDeclarationById(
      template,
      controllerId
    );

    context.serviceTopics?.forEach((serviceTopic) => {
      serviceTopic.patterns.forEach((topic) => {
        if (!topic.topicName) {
          throw new Error(`Topic name not found for topic id ${topic.topicId}`);
        }
        if (topic.type !== EnumMessagePatternConnectionOptions.Receive) return;
        const controllerMethod = redisControllerMethod(topic.topicName);
        controllerClass.body.body.push(controllerMethod);
      });
    });

    await modules.set({
      code: print(template).code,
      path: join(
        serverDirectories.messageBrokerDirectory,
        "redis.controller.ts"
      ),
    });

    return modules;
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

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams
  ): CreateServerDotEnvParams {
    const settings = utils.getPluginSettings(context.pluginInstallations);
    eventParams.envVariables.push(...utils.settingsToVarDict(settings));

    return eventParams;
  }
}

const redisModuleImport = (
  redisModuleName: string
): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(redisModuleName))],
    builders.stringLiteral("./redis/redis.module")
  );
};

const microserviceOptionsImport = (): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importSpecifier(builders.identifier("MicroserviceOptions"))],
    builders.stringLiteral("@nestjs/microservices")
  );
};

const genRedisClientOptsImport = (): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [
      builders.importSpecifier(
        builders.identifier("generateRedisClientOptions")
      ),
    ],
    builders.stringLiteral("./redis/generateRedisClientOptions")
  );
};

const connectRedisMicroserviceExpr = (): namedTypes.ExpressionStatement => {
  const typeArgs = builders.tsTypeParameterInstantiation([
    builders.tsTypeReference(builders.identifier("MicroserviceOptions")),
  ]);
  const expr = builders.callExpression(appConnectMicroserviceObj(), [
    genRedisClientOptsInvocation(),
  ]);
  expr.typeArguments =
    typeArgs as unknown as namedTypes.TypeParameterInstantiation;
  return builders.expressionStatement(expr);
};

const appConnectMicroserviceObj = (): namedTypes.MemberExpression => {
  return builders.memberExpression(
    builders.identifier("app"),
    builders.identifier("connectMicroservice")
  );
};

const genRedisClientOptsInvocation = (): namedTypes.CallExpression => {
  return builders.callExpression(
    builders.identifier("generateRedisClientOptions"),
    [builders.identifier("configService")]
  );
};

const redisControllerMethod = (topicName: string): namedTypes.ClassMethod => {
  return builders.classMethod.from({
    body: builders.blockStatement([]),
    async: true,
    key: builders.identifier(`on${pascalCase(topicName)}`),

    params: [redisMessageId()],
    returnType: builders.tsTypeAnnotation(
      builders.tsTypeReference(
        builders.identifier("Promise"),
        builders.tsTypeParameterInstantiation([builders.tsVoidKeyword()])
      )
    ),
    decorators: [eventPatternDecorator(topicName)],
  });
};

const redisMessageId = (): namedTypes.Identifier => {
  const id = builders.identifier.from({
    name: "message",
    typeAnnotation: builders.tsTypeAnnotation(
      builders.tsTypeReference(builders.identifier("RedisMessage"))
    ),
  });
  //@ts-ignore
  id.decorators = [
    builders.decorator(
      builders.callExpression(builders.identifier("Payload"), [])
    ),
  ];
  return id;
};

const eventPatternDecorator = (topicName: string): namedTypes.Decorator => {
  return builders.decorator(
    builders.callExpression(builders.identifier("EventPattern"), [
      builders.stringLiteral(topicName),
    ])
  );
};

const allMessageBrokerTopicsTypeDeclaration = (topicEnumNames: string[]) => {
  const enumTypes: namedTypes.TSTypeReference[] = topicEnumNames.map(
    (enumName) => builders.tsTypeReference(builders.identifier(enumName))
  );
  const declaration = (rightSide: any) => {
    return builders.exportDeclaration(
      false,
      builders.tsTypeAliasDeclaration(
        builders.identifier("AllMessageBrokerTopics"),
        rightSide
      )
    );
  };
  if (enumTypes.length === 0) {
    return declaration(builders.tsNeverKeyword());
  } else {
    return declaration(builders.tsUnionType(enumTypes));
  }
};

export default RedisBrokerPlugin;
