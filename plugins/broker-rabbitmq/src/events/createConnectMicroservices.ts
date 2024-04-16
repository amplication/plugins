import {
  CreateConnectMicroservicesParams,
  DsgContext,
  EnumMessagePatternConnectionOptions,
} from "@amplication/code-gen-types";
import {
  addImports,
  getFunctionDeclarationById,
  importNames,
} from "../util/ast";
import { builders, namedTypes } from "ast-types";

export function beforeCreateConnectMicroservices(
  context: DsgContext,
  eventParams: CreateConnectMicroservicesParams
): CreateConnectMicroservicesParams {
  const { template } = eventParams;

  const generateRabbitMQClientOptionsImport = importNames(
    [builders.identifier("generateRabbitMQClientOptions")],
    "./rabbitmq/generateRabbitMQClientOptions"
  );

  const MicroserviceOptionsImport = importNames(
    [builders.identifier("MicroserviceOptions")],
    "@nestjs/microservices"
  );

  const rabbitMqStrategyImport = importNames(
    [builders.identifier("RabbitMQ")],
    "./rabbitmq/rabbitmq.transport"
  );

  addImports(
    template,
    [
      generateRabbitMQClientOptionsImport,
      MicroserviceOptionsImport,
      rabbitMqStrategyImport,
    ].filter(
      (x) => x //remove nulls and undefined
    ) as namedTypes.ImportDeclaration[]
  );

  const typeArguments = builders.tsTypeParameterInstantiation([
    builders.tsTypeReference(builders.identifier("MicroserviceOptions")),
  ]);

  context.serviceTopics?.map((serviceTopic) => {
    serviceTopic.patterns.forEach((topic) => {
      if (!topic.topicName) {
        throw new Error(`Topic name not found for topic id ${topic.topicId}`);
      }

      if (topic.type !== EnumMessagePatternConnectionOptions.Receive) return;

      const configOptionExpression = builders.callExpression(
        builders.identifier("generateRabbitMQClientOptions"),
        [
          builders.identifier("configService"),
          builders.stringLiteral(topic.topicName),
        ]
      );

      const appExpression = builders.callExpression(
        builders.memberExpression(
          builders.identifier("app"),
          builders.identifier("connectMicroservice")
        ),
        [
          builders.objectExpression([
            builders.objectProperty(
              builders.identifier("strategy"),
              builders.newExpression(builders.identifier("RabbitMQ"), [
                builders.memberExpression(
                  configOptionExpression,
                  builders.identifier("options")
                ),
              ])
            ),
          ]),
        ]
      );

      appExpression.typeArguments =
        typeArguments as unknown as namedTypes.TypeParameterInstantiation;

      const rabbitmqServiceExpression =
        builders.expressionStatement(appExpression);

      const functionDeclaration = getFunctionDeclarationById(
        template,
        builders.identifier("connectMicroservices")
      );

      functionDeclaration.body.body.push(rabbitmqServiceExpression);
    });
  });

  return eventParams;
}
