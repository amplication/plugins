import type { AmplicationPlugin, Events } from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import {
  afterCreateAdminApp,
  afterCreateAuthModules,
  beforeCreateAdminAppModule,
  beforeCreateAdminDotEnv,
  beforeCreateAuthModules,
  beforeCreatePackageJson,
  beforeCreateServerDotEnv,
} from "./events";

class Auth0Plugin implements AmplicationPlugin {
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
    };
  }
}

export default Auth0Plugin;
