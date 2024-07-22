import { dotnetTypes, FileMap } from "@amplication/code-gen-types";
import { Class } from "@amplication/csharp-ast";
import { pascalCase } from "pascal-case";
import { getMessageBrokerName } from "./get-message-broker-name";
import { createConsumerServiceFile } from "./create-consumer-service-file";
import { createProducerServiceFile } from "./create-producer-service-file";
import { createMessageBrokerControllerFile } from "./create-message-broker-controller-file";
import { createServiceInstallerFile } from "./create-service-installer-file";

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

  const serviceInstallerFile = createServiceInstallerFile(
    resourceName,
    messageBrokerName,
    brokerBasePath
  );
  files.set(serviceInstallerFile);
  return files;
}
