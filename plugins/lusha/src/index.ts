import {
  AmplicationPlugin,
  Events,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import {
  beforeCreateEntityControllerBase,
  afterCreateEntityControllerBase
} from "./events/createController";


class LushaPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateEntityControllerBase]: {
        before: beforeCreateEntityControllerBase,
        after: afterCreateEntityControllerBase,
      },
    };
  }

}

export default LushaPlugin;
