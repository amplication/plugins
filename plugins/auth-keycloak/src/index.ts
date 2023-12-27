import type { AmplicationPlugin, Events } from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { beforeCreateServer } from "./events";

class KeycloakPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServer]: {
        before: beforeCreateServer,
      },
    };
  }
}

export default KeycloakPlugin;
