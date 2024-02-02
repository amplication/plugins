import {
  CreateConnectMicroservicesParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { join, resolve } from "path";
import { staticsPath, templatesPath } from "../constants";
import { print, readFile } from "@amplication/code-gen-utils";
import { EnumResourceType } from "@amplication/code-gen-types/src/models";
import { pascalCase } from "pascal-case";
import {
  addImports,
  getFunctionDeclarationById,
  importNames,
  interpolate,
} from "../util/ast";
import { builders, namedTypes } from "ast-types";

export const afterCreateMessageBrokerClientOptionsFactory = async (
  context: DsgContext,
): Promise<ModuleMap> => {
  const { serverDirectories } = context;
  const filePath = resolve(staticsPath, "generateClientOptions.ts");
  const file = await readFile(filePath);
  const generateFileName = "generateClientOptions.ts";

  const path = join(serverDirectories.messageBrokerDirectory, generateFileName);
  const modules = new ModuleMap(context.logger);
  await modules.set({ code: print(file).code, path });
  return modules;
};

export const afterCreateMessageBrokerNestJSModule = async (
  context: DsgContext,
): Promise<ModuleMap> => {
  const filePath = resolve(staticsPath, "mqtt.module.ts");
  const file = await readFile(filePath);
  const generateFileName = "mqtt.module.ts";

  const moduleFile = {
    code: print(file).code,
    path: join(
      context.serverDirectories.messageBrokerDirectory,
      generateFileName,
    ),
  };

  const modules = new ModuleMap(context.logger);
  await modules.set(moduleFile);
  return modules;
};

export const afterCreateMessageBrokerService = async (
  context: DsgContext,
): Promise<ModuleMap> => {
  const { otherResources, logger } = context;

  const servicePath = join(
    context.serverDirectories.messageBrokerDirectory,
    "mqtt.producer.service.ts",
  );

  let messageBrokerName =
    otherResources?.find(
      (resource) => resource.resourceType === EnumResourceType.MessageBroker,
    )?.resourceInfo?.name ?? null;

  if (!messageBrokerName) {
    logger.warn(
      "Message broker name not found. Did you forget to add a message broker resource? Adding a default name mqtt",
    );
    messageBrokerName = "mqtt";
  }

  const templatePath = join(templatesPath, "mqtt.producer.service.template.ts");
  const template = await readFile(templatePath);
  const templateMapping = {
    BROKER_TOPICS: builders.identifier(
      pascalCase(messageBrokerName) + "Topics",
    ),
  };

  interpolate(template, templateMapping);

  const modules = new ModuleMap(logger);
  await modules.set({ code: print(template).code, path: servicePath });

  const typesPath = join(
    context.serverDirectories.messageBrokerDirectory,
    "types.ts",
  );

  const typesFile = await readFile(join(staticsPath, "types.ts"));
  await modules.set({ code: print(typesFile).code, path: typesPath });

  return modules;
};

export const beforeCreateConnectMicroservices = (
  context: DsgContext,
  eventParams: CreateConnectMicroservicesParams,
) => {
  const { template } = eventParams;

  const generateClientOptionsImport = importNames(
    [builders.identifier("generateClientOptions")],
    "./mqtt/generateClientOptions",
  );

  const MicroserviceOptionsImport = importNames(
    [builders.identifier("MicroserviceOptions")],
    "@nestjs/microservices",
  );

  addImports(template, [
    generateClientOptionsImport,
    MicroserviceOptionsImport,
  ]);

  const connectExpression = builders.callExpression(
    builders.memberExpression(
      builders.identifier("app"),
      builders.identifier("connectMicroservice"),
    ),
    [
      builders.callExpression(builders.identifier("generateClientOptions"), [
        builders.identifier("configService"),
      ]),
    ],
  );

  const typeArguments = builders.tsTypeParameterInstantiation([
    builders.tsTypeReference(builders.identifier("MicroserviceOptions")),
  ]);

  connectExpression.typeArguments =
    typeArguments as unknown as namedTypes.TypeParameterInstantiation;
  const expression = builders.expressionStatement(connectExpression);

  const connectFunctionId = getFunctionDeclarationById(
    template,
    builders.identifier("connectMicroservices"),
  );

  connectFunctionId.body.body.push(expression);

  return eventParams;
};
