import { IFile } from "@amplication/code-gen-types";
import { Class, CsharpSupport, MethodType } from "@amplication/csharp-ast";
import { SERVICE_INSTALLER_METHOD_CODE_BLOCK } from "../constants";
export function createServiceInstallerFile(
  resourceName: string,
  messageBrokerName: string,
  brokerBasePath: string
): IFile<Class> {
  const serviceInstallerClass: Class = CsharpSupport.class_({
    name: `${messageBrokerName}ServiceCollection`,
    namespace: `${resourceName}.Brokers.${messageBrokerName}`,
    abstract: false,
    static_: true,
    sealed: false,
    partial: false,
    access: "public",
  });

  serviceInstallerClass.addMethod(
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
        code: getMethodBlock(messageBrokerName),
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

  return {
    path: `${brokerBasePath}/${messageBrokerName}ServiceCollection.cs`,
    code: serviceInstallerClass,
  };
}

function getMethodBlock(messageBrokerName: string): string {
  const codeBlock: string = SERVICE_INSTALLER_METHOD_CODE_BLOCK;
  return codeBlock.replaceAll("[messageBrokerName]", messageBrokerName);
}
