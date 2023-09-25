import type { AmplicationPlugin, Events } from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import {
  afterCreateApp,
  beforeCreateAdminAppModule,
  beforeCreateAdminDotEnv,
  beforeCreatePackageJson,
  beforeCreateServerDotEnv,
} from "./events";

class ESLintPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateAdminAppModule]: {
        before: beforeCreateAdminAppModule,
      },
      [EventNames.CreateAdminDotEnv]: {
        before: beforeCreateAdminDotEnv,
      },
      [EventNames.CreateAdminUI]: {
        after: afterCreateApp("client"),
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
    };
  }
}

export default ESLintPlugin;
