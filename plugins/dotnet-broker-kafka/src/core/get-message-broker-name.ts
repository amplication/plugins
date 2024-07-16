import { dotnetTypes, EnumResourceType } from "@amplication/code-gen-types";

export function getMessageBrokerName(
  dsgContext: dotnetTypes.DsgContext
): string {
  const { otherResources, logger } = dsgContext;
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
