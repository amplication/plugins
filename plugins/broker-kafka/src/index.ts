import {
  AmplicationPlugin,
  CreateConnectMicroservicesParams,
  CreateMessageBrokerClientOptionsFactoryParams,
  CreateMessageBrokerNestJSModuleParams,
  CreateMessageBrokerParams,
  CreateMessageBrokerServiceParams,
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
import { readFile, print } from "@amplication/code-gen-utils";
import { kebabCase } from "lodash";
import { join, resolve } from "path";
import {
  DOCKER_SERVICE_KAFKA_NAME,
  DOCKER_SERVICE_KAFKA_PORT,
  staticDirectory,
  templatesPath,
  updateDockerComposeDevProperties,
} from "./constants";
import { builders, namedTypes } from "ast-types";
import {
  addImports,
  getClassDeclarationById,
  getFunctionDeclarationById,
  importNames,
  interpolate,
} from "./util/ast";
import { pascalCase } from "pascal-case";
import { EnumResourceType } from "@amplication/code-gen-types/src/models";

class KafkaPlugin implements AmplicationPlugin {
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
        before: this.beforeCreateDockerComposeDevFile,
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
    };
  }

  async afterCreateMessageBrokerClientOptionsFactory(
    context: DsgContext,
    eventParams: CreateMessageBrokerClientOptionsFactoryParams,
  ): Promise<ModuleMap> {
    const { serverDirectories } = context;
    const filePath = resolve(staticDirectory, "generateKafkaClientOptions.ts");
    const file = await readFile(filePath);
    const generateFileName = "generateKafkaClientOptions.ts";

    const path = join(
      serverDirectories.messageBrokerDirectory,
      generateFileName,
    );
    const modules = new ModuleMap(context.logger);
    await modules.set({ code: print(file).code, path });
    return modules;
  }

  beforeCreateBroker(
    dsgContext: DsgContext,
    eventParams: CreateMessageBrokerParams,
  ): CreateMessageBrokerParams {
    dsgContext.serverDirectories.messageBrokerDirectory = join(
      dsgContext.serverDirectories.srcDirectory,
      "kafka",
    );
    return eventParams;
  }

  async afterCreateMessageBrokerNestJSModule(
    context: DsgContext,
    eventParams: CreateMessageBrokerNestJSModuleParams,
  ): Promise<ModuleMap> {
    const filePath = resolve(staticDirectory, "kafka.module.ts");

    const { serverDirectories } = context;
    const { messageBrokerDirectory } = serverDirectories;
    const file = await readFile(filePath);
    const generateFileName = "kafka.module.ts";

    KafkaPlugin.moduleFile = {
      code: print(file).code,
      path: join(messageBrokerDirectory, generateFileName),
    };

    const modules = new ModuleMap(context.logger);
    await modules.set(KafkaPlugin.moduleFile);
    return modules;
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams,
  ): CreateServerDotEnvParams {
    const resourceName = context.resourceInfo?.name;

    const vars = {
      KAFKA_BROKERS: "localhost:9092",
      KAFKA_ENABLE_SSL: "false",
      KAFKA_CLIENT_ID: kebabCase(resourceName),
      KAFKA_GROUP_ID: kebabCase(resourceName),
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
        kafkajs: "^2.2.4",
      },
    };

    eventParams.updateProperties.push(myValues);

    return eventParams;
  }

  async afterCreateMessageBrokerService(
    context: DsgContext,
    eventParams: CreateMessageBrokerServiceParams,
  ): Promise<ModuleMap> {
    const { serverDirectories, logger, otherResources } = context;
    const { messageBrokerDirectory } = serverDirectories;

    const servicePath = join(
      messageBrokerDirectory,
      `kafka.producer.service.ts`,
    );

    let messageBrokerName =
      otherResources?.find(
        (resource) => resource.resourceType === EnumResourceType.MessageBroker,
      )?.resourceInfo?.name ?? null;

    if (!messageBrokerName) {
      logger.warn(
        "Message broker name not found. Did you forget to add a message broker resource?",
      );
      messageBrokerName = "kafka";
    }

    const templatePath = join(
      templatesPath,
      "kafka.producer.service.template.ts",
    );
    const template = await readFile(templatePath);
    const templateMapping = {
      BROKER_TOPICS: builders.identifier(
        pascalCase(messageBrokerName) + "Topics",
      ),
    };

    interpolate(template, templateMapping);

    const kafkaMessageFilePath = resolve(
      `${staticDirectory}/contracts`,
      `KafkaMessage.ts`,
    );
    const kafkaMessageFile = await readFile(kafkaMessageFilePath);
    const kafkaMessagePath = join(messageBrokerDirectory, `KafkaMessage.ts`);

    const kafkaMessageHeaderFilePath = resolve(
      `${staticDirectory}/contracts`,
      `KafkaMessageHeaders.ts`,
    );
    const kafkaMessageHeaderFile = await readFile(kafkaMessageHeaderFilePath);
    const kafkaMessageHeaderPath = join(
      messageBrokerDirectory,
      `KafkaMessageHeaders.ts`,
    );

    const modules = new ModuleMap(logger);
    await modules.set({ code: print(template).code, path: servicePath });
    await modules.set({
      code: print(kafkaMessageFile).code,
      path: kafkaMessagePath,
    });
    await modules.set({
      code: print(kafkaMessageHeaderFile).code,
      path: kafkaMessageHeaderPath,
    });

    return modules;
  }

  beforeCreateDockerComposeFile(
    dsgContext: DsgContext,
    eventParams: CreateServerDockerComposeDevParams,
  ): CreateServerDockerComposeDevParams {
    const updateDockerComposeProperties = {
      services: {
        server: {
          environment: {
            KAFKA_BROKERS: `${DOCKER_SERVICE_KAFKA_NAME}:${DOCKER_SERVICE_KAFKA_PORT}`,
            KAFKA_ENABLE_SSL: "${KAFKA_ENABLE_SSL}",
            KAFKA_CLIENT_ID: "${KAFKA_CLIENT_ID}",
            KAFKA_GROUP_ID: "${KAFKA_GROUP_ID}",
          },
        },
      },
    };
    eventParams.updateProperties.push(updateDockerComposeProperties);
    eventParams.updateProperties.push(updateDockerComposeDevProperties);
    eventParams.updateProperties.push({
      services: {
        [DOCKER_SERVICE_KAFKA_NAME]: {
          environment: {
            KAFKA_ADVERTISED_LISTENERS: `PLAINTEXT://${DOCKER_SERVICE_KAFKA_NAME}:29092,PLAINTEXT_HOST://${DOCKER_SERVICE_KAFKA_NAME}:${DOCKER_SERVICE_KAFKA_PORT}`,
          },
        },
      },
    });
    return eventParams;
  }

  beforeCreateDockerComposeDevFile(
    dsgContext: DsgContext,
    eventParams: CreateServerDockerComposeDevParams,
  ): CreateServerDockerComposeDevParams {
    eventParams.updateProperties.push(updateDockerComposeDevProperties);
    return eventParams;
  }

  beforeCreateServerAppModule(
    dsgContext: DsgContext,
    eventParams: CreateServerAppModuleParams,
  ) {
    const file = KafkaPlugin.moduleFile;
    if (!file) {
      throw new Error("Kafka module file not found");
    }
    const kafkaModuleId = builders.identifier("KafkaModule");

    const importArray = builders.arrayExpression([
      kafkaModuleId,
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
    const controllerId = builders.identifier(`KafkaController`);
    const templateMapping = {
      CONTROLLER: controllerId,
    };

    interpolate(template, templateMapping);
    const classDeclaration = getClassDeclarationById(template, controllerId);
    const { serviceTopics, serverDirectories } = context;

    serviceTopics?.map((serviceTopic) => {
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

        const kafkaValue = builders.identifier.from({
          name: "value",
          typeAnnotation: builders.tsTypeAnnotation(
            builders.tsTypeReference(
              builders.identifier("string | Record<string, any> | null"),
            ),
          ),
        });

        //@ts-expect-error - decorators is defined in the type
        kafkaValue.decorators = [payloadDecorator];

        const kafkaContextDecorator = builders.decorator(
          builders.callExpression(builders.identifier("Ctx"), []),
        );
        const kafkaContext = builders.identifier.from({
          name: "context",
          typeAnnotation: builders.tsTypeAnnotation(
            builders.tsTypeReference(builders.identifier("KafkaContext")),
          ),
        });

        //@ts-expect-error - decorators is defined in the type
        kafkaContext.decorators = [kafkaContextDecorator];

        const currentClassMethod = builders.classMethod.from({
          body: builders.blockStatement([
            builders.variableDeclaration("const", [
              builders.variableDeclarator(
                builders.identifier("message"),
                builders.callExpression(
                  builders.memberExpression(
                    builders.identifier("context"),
                    builders.identifier("getMessage"),
                  ),
                  [],
                ),
              ),
            ]),
          ]),
          async: true,
          key: builders.identifier(`on${pascalCase(topic.topicName)}`),
          params: [kafkaValue, kafkaContext],
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
      serverDirectories.srcDirectory,
      "kafka",
      "kafka.controller.ts",
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

    const generateKafkaClientOptionsImport = importNames(
      [builders.identifier("generateKafkaClientOptions")],
      "./kafka/generateKafkaClientOptions",
    );

    const MicroserviceOptionsImport = importNames(
      [builders.identifier("MicroserviceOptions")],
      "@nestjs/microservices",
    );

    addImports(
      template,
      [generateKafkaClientOptionsImport, MicroserviceOptionsImport].filter(
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
          builders.identifier("generateKafkaClientOptions"),
          [builders.identifier("configService")],
        ),
      ],
    );

    appExpression.typeArguments =
      typeArguments as unknown as namedTypes.TypeParameterInstantiation;

    const kafkaServiceExpression = builders.expressionStatement(appExpression);

    const functionDeclaration = getFunctionDeclarationById(
      template,
      builders.identifier("connectMicroservices"),
    );

    functionDeclaration.body.body.push(kafkaServiceExpression);

    return eventParams;
  }
}

export default KafkaPlugin;
