import {
  EnumMessagePatternConnectionOptions,
  IFile,
  dotnetTypes,
} from "@amplication/code-gen-types";
import {
  Class,
  CsharpSupport,
  Method,
  MethodType,
} from "@amplication/csharp-ast";

export function createMessageBrokerControllerFile(
  resourceName: string,
  messageBrokerName: string,
  brokerBasePath: string,
  dsgContext: dotnetTypes.DsgContext
): IFile<Class> {
  const { logger, serviceTopics } = dsgContext;

  const messageControllerClassName = `${messageBrokerName}MessageHandlersController`;
  const messageHandlerController: Class = CsharpSupport.class_({
    name: messageControllerClassName,
    namespace: `${resourceName}.Brokers.${messageBrokerName}`,
    abstract: false,
    sealed: false,
    partial: false,
    access: "public",
  });
  logger.info(
    `generating topic handler methods for ${messageBrokerName} message controller`
  );
  if (!serviceTopics) {
    logger.warn("No service topics found");
    return {
      path: `${brokerBasePath}/${messageBrokerName}MessageHandlersController.cs`,
      code: messageHandlerController,
    };
  }
  serviceTopics.map((serviceTopic) => {
    logger.info(
      `Creating message handler method for topic messageBrokerId: ${serviceTopic.messageBrokerId}`
    );
    serviceTopic.patterns.forEach((topic) => {
      logger.info(
        `Creating message handler method for topic ${topic.topicName}`
      );
      if (!topic.topicName) {
        throw new Error(`Topic name not found for topic id ${topic.topicId}`);
      }

      if (topic.type !== EnumMessagePatternConnectionOptions.Receive) return;
      const topicHandlerMethod = createMethod(resourceName, topic.topicName);

      messageHandlerController.addMethod(topicHandlerMethod);
    });
  });
  return {
    path: `${brokerBasePath}/${messageBrokerName}MessageHandlersController.cs`,
    code: messageHandlerController,
  };
}

function createMethod(resourceName: string, topicName: string): Method {
  return CsharpSupport.method({
    name: `Handle${topicName}`,
    access: "public",
    type: MethodType.INSTANCE,
    isAsync: false,
    return_: CsharpSupport.Types.reference(
      CsharpSupport.classReference({
        name: "Task",
        namespace: `System.Threading.Tasks`,
      })
    ),
    annotations: [
      CsharpSupport.annotation({
        reference: CsharpSupport.classReference({
          name: "Topic",
          namespace: `${resourceName}.Brokers.Infrastructure`,
        }),
        argument: `"${topicName}"`,
      }),
    ],
    body: CsharpSupport.codeblock({
      code: `//set your message handling logic here \n
      return Task.CompletedTask;`,
    }),
    parameters: [
      CsharpSupport.parameter({
        name: "message",
        type: CsharpSupport.Types.string(),
      }),
    ],
  });
}
