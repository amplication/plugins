import {
  AmplicationPlugin,
  Events,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import {
  beforeCreateEntityControllerBase,
  afterCreateEntityControllerBase
} from "./events/createController";
import {
  beforeCreateEntityServiceBase,
  afterCreateEntityServiceBase
} from "./events/createService";


class LushaPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateEntityControllerBase]: {
        before: beforeCreateEntityControllerBase,
        after: afterCreateEntityControllerBase,
      },
      [EventNames.CreateEntityServiceBase]: {
        before: beforeCreateEntityServiceBase,
        after: afterCreateEntityServiceBase
      }
    };
  }

}

export default LushaPlugin;
