import { IFile } from "@amplication/code-gen-types";
import { Class, CsharpSupport } from "@amplication/csharp-ast";

export function createConsumerServiceFile(
  resourceName: string,
  messageBrokerName: string,
  brokerBasePath: string
): IFile<Class> {
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
            namespace: `${resourceName}.Brokers.Infrastructure`,
          })
        ),
      }),
    ],

    bases: ["serviceScopeFactory", "kafkaOptions"],
  });

  return {
    path: `${brokerBasePath}/${messageBrokerName}ConsumerService.cs`,
    code: consumerService,
  };
}
