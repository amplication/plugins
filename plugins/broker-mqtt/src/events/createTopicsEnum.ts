import {
  CreateMessageBrokerTopicsEnumParams,
  DsgContext,
  EnumMessagePatternConnectionOptions,
  ModuleMap,
  ServiceTopics,
} from "@amplication/code-gen-types";
import { join } from "path";
import { templatesPath } from "../constants";
import { getClassDeclarationById } from "../util/ast";
import { builders, namedTypes } from "ast-types";
import { print, readFile } from "@amplication/code-gen-utils";
import { pascalCase } from "pascal-case";

export const afterCreateTopicsEnum = async (
  context: DsgContext,
  eventParams: CreateMessageBrokerTopicsEnumParams,
  modules: ModuleMap,
): Promise<ModuleMap> => {
  const templatePath = join(templatesPath, "mqtt.controller.template.ts");
  const template = await readFile(templatePath);
  const controllerId = builders.identifier("MqttController");
  const controllerDeclaration = getClassDeclarationById(template, controllerId);
  const { serverDirectories, serviceTopics } = context;

  await addEventPattern(controllerDeclaration, serviceTopics);

  const controllerPath = join(
    serverDirectories.srcDirectory,
    "mqtt",
    "mqtt.controller.ts",
  );

  const controllerModule = {
    code: print(template).code,
    path: controllerPath,
  };

  modules.set(controllerModule);

  return modules;
};

export const addEventPattern = async (
  controllerDeclaration: namedTypes.ClassDeclaration,
  serviceTopics?: ServiceTopics[],
) => {
  serviceTopics?.forEach((serviceTopic) => {
    serviceTopic.patterns.forEach((pattern) => {
      if (!pattern.topicName) {
        throw new Error(`Topic name not found for topic id ${pattern.topicId}`);
      }

      // Only need to add an event pattern for recieve topics
      if (pattern.type !== EnumMessagePatternConnectionOptions.Receive) return;

      // Step 1: Make decorators (Eventpattern, Ctx, Payload)
      const patternDecorator = builders.decorator(
        builders.callExpression(builders.identifier("EventPattern"), [
          builders.stringLiteral(pattern.topicName),
        ]),
      );

      const payloadDecorator = builders.decorator(
        builders.callExpression(builders.identifier("Payload"), []),
      );

      const contextDecorator = builders.decorator(
        builders.callExpression(builders.identifier("Ctx"), []),
      );

      // Step 2: Make parameters to class function
      const value = builders.identifier.from({
        name: "value",
        typeAnnotation: builders.tsTypeAnnotation(
          builders.tsTypeReference(
            builders.identifier("string | Record<string, any> | null"),
          ),
        ),
      });

      const context = builders.identifier.from({
        name: "context",
        typeAnnotation: builders.tsTypeAnnotation(
          builders.tsTypeReference(builders.identifier("MqttContext")),
        ),
      });

      //@ts-expect-error - decorators is defined in the type
      value.decorators = [payloadDecorator];
      //@ts-expect-error - decorators is defined in the type
      context.decorators = [contextDecorator];

      // Step 3: Make the function
      const listener = builders.classMethod.from({
        async: true,
        key: builders.identifier(`on${pascalCase(pattern.topicName)}`),
        params: [value, context],
        decorators: [patternDecorator],
        returnType: builders.tsTypeAnnotation(
          builders.tsTypeReference(
            builders.identifier("Promise"),
            builders.tsTypeParameterInstantiation([builders.tsVoidKeyword()]),
          ),
        ),
        body: builders.blockStatement([
          builders.variableDeclaration("const", [
            builders.variableDeclarator(
              builders.identifier("originalPacket"),
              builders.callExpression(
                builders.memberExpression(
                  builders.identifier("context"),
                  builders.identifier("getPacket"),
                ),
                [],
              ),
            ),
          ]),
          builders.variableDeclaration("const", [
            builders.variableDeclarator(
              builders.identifier("topic"),
              builders.callExpression(
                builders.memberExpression(
                  builders.identifier("context"),
                  builders.identifier("getTopic"),
                ),
                [],
              ),
            ),
          ]),
        ]),
      });

      controllerDeclaration.body.body.push(listener);
    });
  });
};
