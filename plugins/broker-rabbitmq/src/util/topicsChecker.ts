import { DsgContext } from "@amplication/code-gen-types";

export function isMessageBrokerConnected({
  serviceTopics,
  logger,
}: DsgContext): boolean {
  if (serviceTopics && serviceTopics.length > 0) {
    return true;
  }
  logger.warn(
    "No message broker topics were defined and connected to your service, the generated code will not contain actual event handlers for any topic"
  );
  return false;
}
