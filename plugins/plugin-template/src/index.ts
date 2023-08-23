import type { AmplicationPlugin, Events } from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { beforeCreateServer, afterCreateServer } from "./events/CreateServer";
import { beforeCreateAdminUI } from "./events/createAdminUI";

class ExamplePlugin implements AmplicationPlugin {
  /**
   * This is mandatory function that returns an object with the event name. Each event can have before or/and after
   */
  register(): Events {
    return {
      [EventNames.CreateServer]: {
        before: beforeCreateServer,
        after: afterCreateServer,
      },
      [EventNames.CreateAdminUI]: {
        before: beforeCreateAdminUI,
      },
    };
  }
  // You can combine many events in one plugin in order to change the related files.
}

export default ExamplePlugin;
