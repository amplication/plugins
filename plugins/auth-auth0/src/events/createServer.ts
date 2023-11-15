import { CreateServerParams, DsgContext } from "@amplication/code-gen-types";

export const beforeCreateServer = (
  context: DsgContext,
  eventParams: CreateServerParams,
): CreateServerParams => {
  const authEntity = context.entities?.find(
    (x) => x.name === context.resourceInfo?.settings.authEntityName,
  );

  if (!authEntity) {
    throw new Error("Auth entity not found");
  }

  return eventParams;
};
