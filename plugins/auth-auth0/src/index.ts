import type { AmplicationPlugin, Events } from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { afterCreateApp, beforeCreateAdminAppModule } from "./events";

class ESLintPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateAdminAppModule]: {
        before: beforeCreateAdminAppModule,
      },
      [EventNames.CreateAdminUI]: {
        after: afterCreateApp("client"),
      },
    };
  }
}

export default ESLintPlugin;
