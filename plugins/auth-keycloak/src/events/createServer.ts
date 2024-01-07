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

  // Check if auth-core plugin is installed
  if (
    !context.pluginInstallations.some(
      (plugin) => plugin.npm === "@amplication/plugin-auth-core",
    )
  ) {
    throw new Error(
      "The auth-core plugin must be installed for the auth-keycloak plugin to function",
    );
  }

  return eventParams;
};
