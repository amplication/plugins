import { dotnetTypes, FileMap } from "@amplication/code-gen-types";
import { Class, CsharpSupport, MethodType } from "@amplication/csharp-ast";
import { pascalCase } from "pascal-case";
import { getMessageBrokerName } from "./get-message-broker-name";
import { createConsumerServiceFile } from "./create-consumer-service-file";
import { createProducerServiceFile } from "./create-producer-service-file";
import { createMessageBrokerControllerFile } from "./create-message-broker-controller-file";

export async function createMessageBroker(
  dsgContext: dotnetTypes.DsgContext
): Promise<FileMap<Class>> {
  const { serverDirectories, logger, resourceInfo } = dsgContext;

  const files = new FileMap<Class>(dsgContext.logger);
  if (!resourceInfo) return files;
  const resourceName = pascalCase(resourceInfo.name);

  const messageBrokerName = getMessageBrokerName(dsgContext);

  const brokerBasePath = `${serverDirectories.baseDirectory}/src/Brokers/${messageBrokerName}`;
  logger.info(
    `Creating message broker service for ${messageBrokerName}. using path ${brokerBasePath}`
  );

  //create consumerService file
  const consumerServiceFile = createConsumerServiceFile(
    resourceName,
    messageBrokerName,
    brokerBasePath
  );
  files.set(consumerServiceFile);

  //create producerService file
  const producerServiceFile = createProducerServiceFile(
    resourceName,
    messageBrokerName,
    brokerBasePath
  );

  files.set(producerServiceFile);

  //create messageHandlerController file
  const messageHandlerControllerFile = createMessageBrokerControllerFile(
    resourceName,
    messageBrokerName,
    brokerBasePath,
    dsgContext
  );
  files.set(messageHandlerControllerFile);

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
}
