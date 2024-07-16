import { DsgContext } from "@amplication/code-gen-types";
import { EnumResourceType } from "@amplication/code-gen-types/src/models";

export function getMessageBrokerName(context: DsgContext): string {
  const { otherResources, logger } = context;
  let messageBrokerName =
    otherResources?.find(
      (resource) => resource.resourceType === EnumResourceType.MessageBroker
    )?.resourceInfo?.name ?? null;

  if (!messageBrokerName) {
    logger.warn(
      "Message broker name not found. Did you forget to add a message broker resource?"
    );
    messageBrokerName = "kafka";
  }

  return messageBrokerName;
}
