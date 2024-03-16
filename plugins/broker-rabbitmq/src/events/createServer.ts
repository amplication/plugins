import {
  CreateServerParams,
  DsgContext,
  EnumMessagePatternConnectionOptions,
  ModuleMap,
} from "@amplication/code-gen-types";
import { join } from "path";
import { templatesPath } from "../constants";
import { readFile, print } from "@amplication/code-gen-utils";
import { builders } from "ast-types";
import { getClassDeclarationById, interpolate } from "../util/ast";
import { pascalCase } from "pascal-case";

export async function afterCreateServer(
  context: DsgContext,
  eventParams: CreateServerParams,
  modules: ModuleMap
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
        ])
      );

      const payloadDecorator = builders.decorator(
        builders.callExpression(builders.identifier("Payload"), [])
      );

      const messageId = builders.identifier.from({
        name: "message",
        typeAnnotation: builders.tsTypeAnnotation(
          builders.tsTypeReference(builders.identifier("RabbitMQMessage"))
        ),
      });

      const ctxDecorator = builders.decorator(
        builders.callExpression(builders.identifier("Ctx"), [])
      );
      const contextId = builders.identifier.from({
        name: "context",
        typeAnnotation: builders.tsTypeAnnotation(
          builders.tsTypeReference(builders.identifier("RmqContext"))
        ),
      });

      //@ts-expect-error Identifier has Decorator type
      messageId.decorators = [payloadDecorator];
      //@ts-expect-error Identifier has Decorator type
      contextId.decorators = [ctxDecorator];

      const currentClassMethod = builders.classMethod.from({
        body: builders.blockStatement([]),
        async: true,
        key: builders.identifier(`on${pascalCase(topic.topicName)}`),

        params: [messageId, contextId],
        returnType: builders.tsTypeAnnotation(
          builders.tsTypeReference(
            builders.identifier("Promise"),
            builders.tsTypeParameterInstantiation([builders.tsVoidKeyword()])
          )
        ),
        decorators: [eventPatternDecorator],
      });

      classDeclaration.body.body.push(currentClassMethod);
    });
  });
  const filePath = join(
    context.serverDirectories.messageBrokerDirectory,
    "rabbitmq.controller.ts"
  );

  const controllerFile = { code: print(template).code, path: filePath };
  await modules.set(controllerFile);

  const transportTemplatePath = join(
    templatesPath,
    "rabbitmq.transport.template.ts"
  );
  const transportTemplate = await readFile(transportTemplatePath);

  interpolate(transportTemplate, {
    SERVICE_NAME: builders.stringLiteral(
      context.resourceInfo?.name ?? "amplication-generated-service"
    ),
  });

  const transportFile = {
    code: print(transportTemplate).code,
    path: join(
      context.serverDirectories.messageBrokerDirectory,
      "rabbitmq.transport.ts"
    ),
  };
  await modules.set(transportFile);

  return modules;
}
