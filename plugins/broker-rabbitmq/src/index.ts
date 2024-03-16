import {
  AmplicationPlugin,
  CreateMessageBrokerClientOptionsFactoryParams,
  CreateMessageBrokerNestJSModuleParams,
  CreateMessageBrokerParams,
  CreateMessageBrokerTopicsEnumParams,
  CreateServerAppModuleParams,
  CreateServerDockerComposeDevParams,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  DsgContext,
  Events,
  Module,
  ModuleMap,
} from "@amplication/code-gen-types";
import { readFile, print, appendImports } from "@amplication/code-gen-utils";
import { kebabCase, merge } from "lodash";
import { join, resolve } from "path";
import { staticDirectory } from "./constants";
import { builders, namedTypes } from "ast-types";
import { parse } from "./util/ast";
import { getPluginSettings } from "./utils";
import {
  afterCreateMessageBrokerService,
  afterCreateServer,
  beforeCreateConnectMicroservices,
} from "./events";
import { TSTypeKind } from "ast-types/gen/kinds";

class RabbitMQPlugin implements AmplicationPlugin {
  static moduleFile: Module | undefined;
  init?: ((name: string, version: string) => void) | undefined;
  register(): Events {
    return {
      CreateServerDotEnv: {
        before: this.beforeCreateServerDotEnv,
      },
      CreateServer: {
        after: afterCreateServer,
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
        after: afterCreateMessageBrokerService,
      },
      CreateConnectMicroservices: {
        before: beforeCreateConnectMicroservices,
      },
      CreateMessageBrokerTopicsEnum: {
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
      context.logger.warn(
        "No message broker topics were defined and connected to your service, the generated code will not contain actual event handlers for any topic"
      );
      return modules;
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
            "Couldn't find the name of an enum in the message broker topics file"
          );
        }
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

  async afterCreateMessageBrokerClientOptionsFactory(
    context: DsgContext,
    eventParams: CreateMessageBrokerClientOptionsFactoryParams
  ): Promise<ModuleMap> {
    const { serverDirectories } = context;
    const filePath = resolve(
      staticDirectory,
      "generateRabbitMQClientOptions.ts"
    );
    const file = await readFile(filePath);
    const generateFileName = "generateRabbitMQClientOptions.ts";

    const path = join(
      serverDirectories.messageBrokerDirectory,
      generateFileName
    );

    const modules = new ModuleMap(context.logger);
    await modules.set({ code: print(file).code, path });
    return modules;
  }

  beforeCreateBroker(
    dsgContext: DsgContext,
    eventParams: CreateMessageBrokerParams
  ): CreateMessageBrokerParams {
    dsgContext.serverDirectories.messageBrokerDirectory = join(
      dsgContext.serverDirectories.srcDirectory,
      "rabbitmq"
    );
    return eventParams;
  }

  async afterCreateMessageBrokerNestJSModule(
    context: DsgContext,
    eventParams: CreateMessageBrokerNestJSModuleParams
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
    eventParams: CreateServerDotEnvParams
  ): CreateServerDotEnvParams {
    const resourceName = context.resourceInfo?.name;

    const { host, port, user, password } = getPluginSettings(
      context.pluginInstallations
    );

    const vars = {
      RABBITMQ_URLS: `amqp://${user}:${password}@${host}:${port}`,
      RABBITMQ_SUBSCRIBE_GROUP: kebabCase(resourceName),
    };
    const newEnvParams = [
      ...eventParams.envVariables,
      ...Object.entries(vars).map(([key, value]) => ({ [key]: value })),
    ];
    return { envVariables: newEnvParams };
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams
  ): CreateServerPackageJsonParams {
    const myValues = {
      dependencies: {
        "@nestjs/microservices": "10.2.7",
        "amqp-connection-manager": "^4.1.14",
        amqplib: "^0.10.3",
      },
    };

    eventParams.updateProperties.forEach((updateProperty) =>
      merge(updateProperty, myValues)
    );

    return eventParams;
  }

  beforeCreateDockerComposeFile(
    dsgContext: DsgContext,
    eventParams: CreateServerDockerComposeDevParams
  ): CreateServerDockerComposeDevParams {
    const { password, user } = getPluginSettings(
      dsgContext.pluginInstallations
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
    eventParams: CreateServerAppModuleParams
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
}

const rabbitModuleImport = (
  rabbitMqModuleName: string
): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importSpecifier(builders.identifier(rabbitMqModuleName))],
    builders.stringLiteral("./rabbitmq/rabbitmq.module")
  );
};

const allMessageBrokerTopicsTypeDeclaration = (topicEnumNames: string[]) => {
  const enumTypes: namedTypes.TSTypeReference[] = topicEnumNames.map(
    (enumName) => builders.tsTypeReference(builders.identifier(enumName))
  );
  const declaration = (rightSide: TSTypeKind) => {
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

export default RabbitMQPlugin;
