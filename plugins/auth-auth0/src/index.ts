import type { AmplicationPlugin, Events } from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import {
  afterCreateApp,
  beforeCreateAdminAppModule,
  beforeCreateAdminDotEnv,
  beforeCreatePackageJson,
} from "./events";

class ESLintPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateAdminAppModule]: {
        before: beforeCreateAdminAppModule,
      },
      [EventNames.CreateAdminUIPackageJson]: {
        before: beforeCreatePackageJson("client"),
      },
      [EventNames.CreateAdminDotEnv]: {
        before: beforeCreateAdminDotEnv,
      },
      [EventNames.CreateAdminUI]: {
        after: afterCreateApp("client"),
      },
    };
  }
}

export default ESLintPlugin;
