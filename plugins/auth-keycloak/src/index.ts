import type { AmplicationPlugin, Events } from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import {
  afterCreateAdminApp,
  afterCreateAuthModules,
  beforeCreateAdminAppModule,
  beforeCreateAdminDotEnv,
  beforeCreateAuthModules,
  beforeCreatePackageJson,
  beforeCreateSeed,
  beforeCreateServer,
  beforeCreateServerDockerCompose,
  beforeCreateServerDockerComposeDev,
  beforeCreateServerDotEnv,
} from "./events";

class KeycloakPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateAdminAppModule]: {
        before: beforeCreateAdminAppModule,
      },
      [EventNames.CreateAdminDotEnv]: {
        before: beforeCreateAdminDotEnv,
      },
      [EventNames.CreateAdminUI]: {
        after: afterCreateAdminApp,
      },
      [EventNames.CreateAdminUIPackageJson]: {
        before: beforeCreatePackageJson("client"),
      },
      [EventNames.CreateServerDotEnv]: {
        before: beforeCreateServerDotEnv,
      },
      [EventNames.CreateServerPackageJson]: {
        before: beforeCreatePackageJson("server"),
      },
      [EventNames.CreateServerAuth]: {
        before: beforeCreateAuthModules,
        after: afterCreateAuthModules,
      },
      [EventNames.CreateSeed]: {
        before: beforeCreateSeed,
      },
      [EventNames.CreateServer]: {
        before: beforeCreateServer,
      },
      [EventNames.CreateServerDockerCompose]: {
        before: beforeCreateServerDockerCompose,
      },
      [EventNames.CreateServerDockerComposeDev]: {
        before: beforeCreateServerDockerComposeDev,
      },
    };
  }
}

export default KeycloakPlugin;
