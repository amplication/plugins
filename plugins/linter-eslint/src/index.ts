import type {
  AmplicationPlugin,
  Events,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { afterCreateServer, beforeCreateClientPackageJson, beforeCreateServerPackageJson } from "./events";

class ESLintPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServer]: {
        after: afterCreateServer,
      },
      [EventNames.CreateServerPackageJson]: {
        before: beforeCreateServerPackageJson,
      },
      [EventNames.CreateAdminUIPackageJson]: {
        before: beforeCreateClientPackageJson,
      },
    };
  }
}

export default ESLintPlugin;
