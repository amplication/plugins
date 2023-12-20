import {
  AmplicationPlugin,
  CreateConnectMicroservicesParams,
  CreateMessageBrokerClientOptionsFactoryParams,
  CreateMessageBrokerNestJSModuleParams,
  CreateMessageBrokerParams,
  CreateMessageBrokerServiceParams,
  CreateMessageBrokerTopicsEnumParams,
  CreateServerAppModuleParams,
  CreateServerAuthParams,
  CreateServerDockerComposeDevParams,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  DsgContext,
  EnumMessagePatternConnectionOptions,
  Events,
  Module,
  ModuleMap,
} from "@amplication/code-gen-types";
import { readFile, print, appendImports } from "@amplication/code-gen-utils";
import { kebabCase, merge } from "lodash";
import { join, resolve } from "path";
import { staticDirectory, templatesPath } from "./constants";
import { builders, namedTypes } from "ast-types";
import {
  addImports,
  getClassDeclarationById,
  getFunctionDeclarationById,
  importNames,
  interpolate,
  parse,
} from "./util/ast";
import { pascalCase } from "pascal-case";
import { getPluginSettings } from "./utils";
import { TSTypeKind } from "ast-types/gen/kinds";

class RabbitMQPlugin implements AmplicationPlugin {
  static moduleFile: Module | undefined;
  init?: ((name: string, version: string) => void) | undefined;
  register(): Events {
    return {
      CreateServerDotEnv: {
        before: this.beforeCreateServerDotEnv,
      },

      CreateServerAuth: {
        after: this.afterCreateServerAuth,
      },
      CreateServerDockerCompose: {
        before: this.beforeCreateDockerComposeFile,
      },
      CreateServerPackageJson: {
        before: this.beforeCreateServerPackageJson,
      },
      CreateServerDockerComposeDev: {
        before: this.beforeCreateDockerComposeFile,
      },
      CreateMessageBroker: {
        before: this.beforeCreateBroker,
      },
      CreateServerAppModule: {
        before: this.beforeCreateServerAppModule,
      },
      CreateMessageBrokerClientOptionsFactory: {
        after: this.afterCreateMessageBrokerClientOptionsFactory,
      },
      CreateMessageBrokerNestJSModule: {
        after: this.afterCreateMessageBrokerNestJSModule,
      },
      CreateMessageBrokerService: {
        after: this.afterCreateMessageBrokerService,
      },
      CreateConnectMicroservices: {
        before: this.beforeCreateConnectMicroservices,
      },
      CreateMessageBrokerTopicsEnum: {
        after: this.afterCreateMessageBrokerTopicsEnum,
      },
    };
  }

  async afterCreateMessageBrokerTopicsEnum(
    context: DsgContext,
    eventParams: CreateMessageBrokerTopicsEnumParams,
    modules: ModuleMap,
  ): Promise<ModuleMap> {
    const { serverDirectories } = context;
    const topicsPath = join(
      serverDirectories.messageBrokerDirectory,
      "topics.ts",
    );
    const topicsModule = modules.get(topicsPath);
    if (!topicsModule) {
      throw new Error(
        "Failed to find the topics.ts file for the message broker topics enum",
      );
    }

    const topicsFile = parse(topicsModule.code);
    const topicEnumNames: string[] = [];
    topicsFile.program.body.forEach((stmt) => {
      if (stmt.type === "ExportNamedDeclaration") {
        if (
          stmt.declaration?.type === "TSEnumDeclaration" &&
          stmt.declaration.id.name
        ) {
          topicEnumNames.push(stmt.declaration.id.name);
        } else {
          throw new Error(
            "Couldn't find the name of an enum in the message broker topics file",
          );
        }
      }
    });
    const umbrellaTypeDeclaration =
      allMessageBrokerTopicsTypeDeclaration(topicEnumNames);
    topicsFile.program.body.push(
      builders.emptyStatement(),
      umbrellaTypeDeclaration,
    );

    await modules.set({
      code: print(topicsFile).code,
      path: topicsPath,
    });
    return modules;
  }

  async afterCreateMessageBrokerClientOptionsFactory(
    context: DsgContext,
    eventParams: CreateMessageBrokerClientOptionsFactoryParams,
  ): Promise<ModuleMap> {
    const { serverDirectories } = context;
    const filePath = resolve(
      staticDirectory,
      "generateRabbitMQClientOptions.ts",
    );
    const file = await readFile(filePath);
    const generateFileName = "generateRabbitMQClientOptions.ts";

    const path = join(
      serverDirectories.messageBrokerDirectory,
      generateFileName,
    );

    const testFilePath = resolve(
      staticDirectory,
      "generateRabbitMQClientOptions.testfile.ts",
    );
    const testFile = await readFile(testFilePath);
    const testGenerateFileName = "generateRabbitMQClientOptions.spec.ts";

    const testPath = join(
      serverDirectories.messageBrokerDirectory,
      testGenerateFileName,
    );

    const modules = new ModuleMap(context.logger);
    await modules.set({ code: print(file).code, path });
    await modules.set({ code: print(testFile).code, path: testPath });
    return modules;
  }

  beforeCreateBroker(
    dsgContext: DsgContext,
    eventParams: CreateMessageBrokerParams,
  ): CreateMessageBrokerParams {
    dsgContext.serverDirectories.messageBrokerDirectory = join(
      dsgContext.serverDirectories.srcDirectory,
      "rabbitmq",
    );
    return eventParams;
  }

  async afterCreateMessageBrokerNestJSModule(
    context: DsgContext,
    eventParams: CreateMessageBrokerNestJSModuleParams,
  ): Promise<ModuleMap> {
    const filePath = resolve(staticDirectory, "rabbitmq.module.ts");

    const { serverDirectories } = context;
    const { messageBrokerDirectory } = serverDirectories;
    const file = await readFile(filePath);
    const generateFileName = "rabbitmq.module.ts";

    RabbitMQPlugin.moduleFile = {
      code: print(file).code,
      path: join(messageBrokerDirectory, generateFileName),
    };

    const modules = new ModuleMap(context.logger);
    await modules.set(RabbitMQPlugin.moduleFile);
    return modules;
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams,
  ): CreateServerDotEnvParams {
    const resourceName = context.resourceInfo?.name;

    const { host, port, user, password } = getPluginSettings(
      context.pluginInstallations,
    );

    const vars = {
      RABBITMQ_URLS: `amqp://${user}:${password}@${host}:${port}`,
      RABBITMQ_QUEUE: kebabCase(resourceName),
    };
    const newEnvParams = [
      ...eventParams.envVariables,
      ...Object.entries(vars).map(([key, value]) => ({ [key]: value })),
    ];
    return { envVariables: newEnvParams };
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams,
  ): CreateServerPackageJsonParams {
    const myValues = {
      dependencies: {
        "@nestjs/microservices": "10.2.7",
        "amqp-connection-manager": "^4.1.14",
        amqplib: "^0.10.3",
      },
    };

    eventParams.updateProperties.forEach((updateProperty) =>
      merge(updateProperty, myValues),
    );

    return eventParams;
  }

  async afterCreateMessageBrokerService(
    context: DsgContext,
    eventParams: CreateMessageBrokerServiceParams,
  ): Promise<ModuleMap> {
    const { serverDirectories } = context;
    const { messageBrokerDirectory } = serverDirectories;

    const serviceFilePath = resolve(
      staticDirectory,
      `rabbitmq.producer.service.ts`,
    );
    const serviceFile = await readFile(serviceFilePath);
    const servicePath = join(
      messageBrokerDirectory,
      `rabbitmq.producer.service.ts`,
    );

    const rabbitmqMessageFilePath = resolve(
      `${staticDirectory}/contracts`,
      `RabbitMQMessage.ts`,
    );
    const rabbitmqMessageFile = await readFile(rabbitmqMessageFilePath);
    const rabbitmqMessagePath = join(
      messageBrokerDirectory,
      `RabbitMQMessage.ts`,
    );

    const rabbitmqMessageHeaderFilePath = resolve(
      `${staticDirectory}/contracts`,
      `RabbitMQMessageHeaders.ts`,
    );
    const rabbitmqMessageHeaderFile = await readFile(
      rabbitmqMessageHeaderFilePath,
    );
    const rabbitmqMessageHeaderPath = join(
      messageBrokerDirectory,
      `RabbitMQMessageHeaders.ts`,
    );

    const modules = new ModuleMap(context.logger);
    await modules.set({ code: print(serviceFile).code, path: servicePath });
    await modules.set({
      code: print(rabbitmqMessageFile).code,
      path: rabbitmqMessagePath,
    });
    await modules.set({
      code: print(rabbitmqMessageHeaderFile).code,
      path: rabbitmqMessageHeaderPath,
    });

    return modules;
  }

  beforeCreateDockerComposeFile(
    dsgContext: DsgContext,
    eventParams: CreateServerDockerComposeDevParams,
  ): CreateServerDockerComposeDevParams {
    const { password, user } = getPluginSettings(
      dsgContext.pluginInstallations,
    );
    const RABBITMQ_NAME = "rabbitmq";
    const RABBITMQ_PORT = "5672";
    const RABBITMQ_UI_PORT = "15672";

    const newParams = {
      services: {
        [RABBITMQ_NAME]: {
          image: "rabbitmq:3-management",
          environment: {
            RABBITMQ_DEFAULT_USER: user,
            RABBITMQ_DEFAULT_PASS: password,
          },
          ports: [
            `${RABBITMQ_PORT}:${RABBITMQ_PORT}`,
            `${RABBITMQ_UI_PORT}:${RABBITMQ_UI_PORT}`,
          ],
        },
      },
    };
    eventParams.updateProperties.push(newParams);
    return eventParams;
  }

  beforeCreateServerAppModule(
    dsgContext: DsgContext,
    eventParams: CreateServerAppModuleParams,
  ) {
    const file = RabbitMQPlugin.moduleFile;
    if (!file) {
      throw new Error("RabbitMQ module file not found");
    }
    const rabbitMQModuleName = "RabbitMQModule";
    appendImports(eventParams.template, [
      rabbitModuleImport(rabbitMQModuleName),
    ]);

    const rabbitmqModuleId = builders.identifier(rabbitMQModuleName);

    const importArray = builders.arrayExpression([
      rabbitmqModuleId,
      ...eventParams.templateMapping["MODULES"].elements,
    ]);

    eventParams.templateMapping["MODULES"] = importArray;

    eventParams.modulesFiles.set(file);
    return eventParams;
  }

  async afterCreateServerAuth(
    context: DsgContext,
    eventParams: CreateServerAuthParams,
    modules: ModuleMap,
  ): Promise<ModuleMap> {
    const templatePath = join(templatesPath, "controller.template.ts");
    const template = await readFile(templatePath);
    const controllerId = builders.identifier(`RabbitMQController`);
    const templateMapping = {
      CONTROLLER: controllerId,
    };

    interpolate(template, templateMapping);
    const classDeclaration = getClassDeclarationById(template, controllerId);

    context.serviceTopics?.map((serviceTopic) => {
      serviceTopic.patterns.forEach((topic) => {
        if (!topic.topicName) {
          throw new Error(`Topic name not found for topic id ${topic.topicId}`);
        }

        if (topic.type !== EnumMessagePatternConnectionOptions.Receive) return;

        const eventPatternDecorator = builders.decorator(
          builders.callExpression(builders.identifier("EventPattern"), [
            builders.stringLiteral(topic.topicName),
          ]),
        );

        const payloadDecorator = builders.decorator(
          builders.callExpression(builders.identifier("Payload"), []),
        );

        const messageId = builders.identifier.from({
          name: "message",
          typeAnnotation: builders.tsTypeAnnotation(
            builders.tsTypeReference(builders.identifier("RabbitMQMessage")),
          ),
        });

        const decorators: namedTypes.Decorator[] = [payloadDecorator];

        //@ts-expect-error Identifier has Decorator type
        messageId.decorators = decorators;

        const currentClassMethod = builders.classMethod.from({
          body: builders.blockStatement([]),
          async: true,
          key: builders.identifier(`on${pascalCase(topic.topicName)}`),

          params: [messageId],
          returnType: builders.tsTypeAnnotation(
            builders.tsTypeReference(
              builders.identifier("Promise"),
              builders.tsTypeParameterInstantiation([builders.tsVoidKeyword()]),
            ),
          ),
          decorators: [eventPatternDecorator],
        });

        classDeclaration.body.body.push(currentClassMethod);
      });
    });
    const filePath = join(
      context.serverDirectories.srcDirectory,
      "rabbitmq",
      "rabbitmq.controller.ts",
    );

    const controllerFile = { code: print(template).code, path: filePath };
    await modules.set(controllerFile);

    return modules;
  }

  beforeCreateConnectMicroservices(
    context: DsgContext,
    eventParams: CreateConnectMicroservicesParams,
  ): CreateConnectMicroservicesParams {
    const { template } = eventParams;

    const generateRabbitMQClientOptionsImport = importNames(
      [builders.identifier("generateRabbitMQClientOptions")],
      "./rabbitmq/generateRabbitMQClientOptions",
    );

    const MicroserviceOptionsImport = importNames(
      [builders.identifier("MicroserviceOptions")],
      "@nestjs/microservices",
    );

    addImports(
      template,
      [generateRabbitMQClientOptionsImport, MicroserviceOptionsImport].filter(
        (x) => x, //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[],
    );

    const typeArguments = builders.tsTypeParameterInstantiation([
      builders.tsTypeReference(builders.identifier("MicroserviceOptions")),
    ]);

    const appExpression = builders.callExpression(
      builders.memberExpression(
        builders.identifier("app"),
        builders.identifier("connectMicroservice"),
      ),
      [
        builders.callExpression(
          builders.identifier("generateRabbitMQClientOptions"),
          [builders.identifier("configService")],
        ),
      ],
    );

    appExpression.typeArguments =
      typeArguments as unknown as namedTypes.TypeParameterInstantiation;

    const rabbitmqServiceExpression =
      builders.expressionStatement(appExpression);

    const functionDeclaration = getFunctionDeclarationById(
      template,
      builders.identifier("connectMicroservices"),
    );

    functionDeclaration.body.body.push(rabbitmqServiceExpression);

    return eventParams;
  }
}

const rabbitModuleImport = (
  rabbitMqModuleName: string,
): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(rabbitMqModuleName))],
    builders.stringLiteral("./rabbitmq/rabbitmq.module"),
  );
};

const allMessageBrokerTopicsTypeDeclaration = (topicEnumNames: string[]) => {
  const enumTypes: namedTypes.TSTypeReference[] = topicEnumNames.map(
    (enumName) => builders.tsTypeReference(builders.identifier(enumName)),
  );
  const declaration = (rightSide: TSTypeKind) => {
    return builders.exportDeclaration(
      false,
      builders.tsTypeAliasDeclaration(
        builders.identifier("AllMessageBrokerTopics"),
        rightSide,
      ),
    );
  };
  if (enumTypes.length === 0) {
    return declaration(builders.tsNeverKeyword());
  } else {
    return declaration(builders.tsUnionType(enumTypes));
  }
};

export default RabbitMQPlugin;
