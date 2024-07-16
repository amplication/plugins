import {
  dotnetTypes,
  EnumMessagePatternConnectionOptions,
  EnumResourceType,
  FileMap,
  ServiceTopics,
} from "@amplication/code-gen-types";
import { Class, CsharpSupport, MethodType } from "@amplication/csharp-ast";
import { pascalCase } from "pascal-case";

export async function createMessageBroker(
  dsgContext: dotnetTypes.DsgContext
): Promise<FileMap<Class>> {
  const {
    serverDirectories,
    logger,
    otherResources,
    resourceInfo,
    serviceTopics,
  } = dsgContext;
  const files = new FileMap<Class>(dsgContext.logger);
  let messageBrokerName =
    otherResources?.find(
      (resource) => resource.resourceType === EnumResourceType.MessageBroker
    )?.resourceInfo?.name ?? null;
  if (!resourceInfo) return files;
  const resourceName = pascalCase(resourceInfo.name);
  if (!messageBrokerName) {
    logger.warn(
      "Message broker name not found. Did you forget to add a message broker resource?"
    );
    messageBrokerName = "kafka";
  }
  const brokerBasePath = `${serverDirectories.baseDirectory}/src/Brokers/${messageBrokerName}`;
  logger.info(
    `Creating message broker service for ${messageBrokerName}. using path ${brokerBasePath}`
  );

  //add consumerService
  const consumerService = getConsumerService(resourceName, messageBrokerName);
  //add consumerService to files
  files.set({
    path: `${brokerBasePath}/${messageBrokerName}ConsumerService.cs`,
    code: consumerService,
  });
  //add producerService
  const producerService = getProducerService(resourceName, messageBrokerName);

  files.set({
    path: `${brokerBasePath}/${messageBrokerName}ProducerService.cs`,
    code: producerService,
  });

  const messageHandlerController = getController(
    resourceName,
    messageBrokerName,
    serviceTopics
  );
  files.set({
    path: `${brokerBasePath}/${messageBrokerName}MessageHandlersController.cs`,
    code: messageHandlerController,
  });
  const serviceInstaller = getServiceInstaller(resourceName, messageBrokerName);
  files.set({
    path: `${brokerBasePath}/${messageBrokerName}ServiceCollection.cs`,
    code: serviceInstaller,
  });
  return files;

  function getServiceInstaller(
    resourceName: string,
    messageBrokerName: string
  ): Class {
    // const messageControllerClassName = `${messageBrokerName}MessageHandlersController`;
    const serviceInstaller: Class = CsharpSupport.class_({
      name: `${messageBrokerName}ServiceCollection`,
      namespace: `${resourceName}.Brokers.${messageBrokerName}`,
      abstract: false,
      static_: true,
      sealed: false,
      partial: false,
      access: "public",
    });
    //add using of DotnetService.Brokers.Infrastructure
    serviceInstaller.addMethod(
      CsharpSupport.method({
        name: `Add${messageBrokerName}`,
        access: "public",
        type: MethodType.STATIC,
        isAsync: false,
        return_: CsharpSupport.Types.reference(
          CsharpSupport.classReference({
            name: "IServiceCollection",
            namespace: `Microsoft.Extensions.DependencyInjection`,
          })
        ),
        classReference: CsharpSupport.classReference({
          name: "KafkaOptions",
          namespace: `${resourceName}.Brokers.Infrastructure`,
        }),
        body: CsharpSupport.codeblock({
          code: `
        var kafkaOptions = app.Configuration.GetSection("${messageBrokerName}").Get<KafkaOptions>();
        if (kafkaOptions == null)
            throw new Exception("KafkaOptions not found in configuration section ${messageBrokerName}");
        if (kafkaOptions.ConsumerGroupId == null)
            throw new Exception("ConsumerGroupId not found in configuration section ${messageBrokerName}");
        if (kafkaOptions.BootstrapServers == null)
            throw new Exception("BootstrapServers not found in configuration section ${messageBrokerName}");
        return app.Services.AddHostedService(x => new ${messageBrokerName}ConsumerService(x.GetRequiredService<IServiceScopeFactory>(), kafkaOptions))
            .AddSingleton(x => new ${messageBrokerName}ProducerService(kafkaOptions.BootstrapServers))
            .AddScoped<${messageBrokerName}MessageHandlersController>();
`,
          references: [
            CsharpSupport.classReference({
              namespace: `${resourceName}.Brokers.Infrastructure`,
              name: "KafkaOptions",
            }),
          ],
        }),
        parameters: [],
        extensionParameter: CsharpSupport.parameter({
          name: "app",

          type: CsharpSupport.Types.reference(
            CsharpSupport.classReference({
              name: "IHostApplicationBuilder",
              namespace: `Microsoft.Extensions.Hosting`,
            })
          ),
        }),
      })
    );

    return serviceInstaller;
  }
  function getController(
    resourceName: string,
    messageBrokerName: string,
    serviceTopics?: ServiceTopics[]
  ): Class {
    const messageControllerClassName = `${messageBrokerName}MessageHandlersController`;
    //add message controller
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
      return messageHandlerController;
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
        const topicHandler = CsharpSupport.method({
          name: `Handle${topic.topicName}`,
          access: "public",
          type: MethodType.INSTANCE,
          isAsync: true,
          return_: CsharpSupport.Types.reference(
            CsharpSupport.classReference({
              name: "Task",
              namespace: `System.Threading.Tasks`,
            })
          ),
          body: CsharpSupport.codeblock({
            code: `//set your message handling logic here`,
          }),
          parameters: [
            CsharpSupport.parameter({
              name: "message",
              type: CsharpSupport.Types.string(),
            }),
          ],
        });

        messageHandlerController.addMethod(topicHandler);
      });
    });
    return messageHandlerController;
  }

  function getConsumerService(resourceName: string, messageBrokerName: string) {
    const messageControllerClassName = `${messageBrokerName}MessageHandlersController`;
    const consumerService: Class = CsharpSupport.class_({
      name: `${messageBrokerName}ConsumerService`,
      namespace: `${resourceName}.Brokers.${messageBrokerName}`,
      abstract: false,
      sealed: false,
      partial: false,
      access: "public",

      parentClassReference: CsharpSupport.genericClassReference({
        reference: CsharpSupport.classReference({
          name: "KafkaConsumerService",
          namespace: `${resourceName}.Brokers.Infrastructure`,
        }),
        innerType: CsharpSupport.Types.reference(
          CsharpSupport.classReference({
            name: messageControllerClassName,
            namespace: `${resourceName}.Brokers.${messageBrokerName}`,
          })
        ),
      }),
    });
    consumerService.addConstructor({
      access: "public",
      parameters: [
        CsharpSupport.parameter({
          name: "serviceScopeFactory",
          type: CsharpSupport.Types.reference(
            CsharpSupport.classReference({
              name: "IServiceScopeFactory",
              namespace: `Microsoft.Extensions.DependencyInjection`,
            })
          ),
        }),
        CsharpSupport.parameter({
          name: "kafkaOptions",
          type: CsharpSupport.Types.reference(
            CsharpSupport.classReference({
              name: "KafkaOptions",
              namespace: `DotnetService.Brokers.Infrastructure`,
            })
          ),
        }),
      ],

      bases: ["serviceScopeFactory", "kafkaOptions"],
    });
    return consumerService;
  }

  function getProducerService(resourceName: string, messageBrokerName: string) {
    const messageControllerClassName = `${messageBrokerName}MessageHandlersController`;
    const producerService: Class = CsharpSupport.class_({
      name: `${messageBrokerName}ProducerService`,
      namespace: `${resourceName}.Brokers.${messageBrokerName}`,
      abstract: false,
      sealed: false,
      partial: false,
      access: "public",

      parentClassReference: CsharpSupport.classReference({
        name: "InternalProducer",
        namespace: `${resourceName}.Brokers.Infrastructure`,
      }),
    });
    producerService.addConstructor({
      access: "public",
      parameters: [
        CsharpSupport.parameter({
          name: "bootstrapServers",
          type: CsharpSupport.Types.string(),
        }),
      ],

      bases: ["bootstrapServers"],
    });

    return producerService;
  }
}
