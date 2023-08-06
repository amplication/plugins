import type {
  AmplicationPlugin,
  Events,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { afterCreateApp, beforeCreatePackageJson,  } from "./events";

class ESLintPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServer]: {
        after: afterCreateApp("server"),
      },
      [EventNames.CreateAdminUI]: {
        after: afterCreateApp("client"),
      },
      [EventNames.CreateServerPackageJson]: {
        before: beforeCreatePackageJson("server"),
      },
      [EventNames.CreateAdminUIPackageJson]: {
        before: beforeCreatePackageJson("client"),
      },
    };
  }
}

export default ESLintPlugin;
