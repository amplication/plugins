import { IFile } from "@amplication/code-gen-types";
import { Class, CsharpSupport } from "@amplication/csharp-ast";

export function createProducerServiceFile(
  resourceName: string,
  messageBrokerName: string,
  brokerBasePath: string
): IFile<Class> {
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

  return {
    path: `${brokerBasePath}/${messageBrokerName}ProducerService.cs`,
    code: producerService,
  };
}
