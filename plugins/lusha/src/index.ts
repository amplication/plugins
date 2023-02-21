import { AmplicationPlugin, Events } from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import {
  beforeCreateEntityControllerBase,
  afterCreateEntityControllerBase,
} from "./events/createController";
import {
  beforeCreateEntityServiceBase,
  afterCreateEntityServiceBase,
} from "./events/createService";
import { afterCreateServerModules } from "./events/createDTOs";
import { afterCreateEntityModule, afterCreatePrismaSchemaModule } from "./events/createEntityModule";
import { beforeCreateAppModule, afterCreateAppModule } from "./events/createAppModule";

class LushaPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateEntityControllerBase]: {
        before: beforeCreateEntityControllerBase,
        after: afterCreateEntityControllerBase,
      },
      [EventNames.CreateEntityServiceBase]: {
        before: beforeCreateEntityServiceBase,
        after: afterCreateEntityServiceBase,
      },
      [EventNames.CreateServer]: {
        after: afterCreateServerModules,
      },
      [EventNames.CreateEntityModule]: {
        after: afterCreateEntityModule,
      },
      [EventNames.CreatePrismaSchema]: {
        after: afterCreatePrismaSchemaModule,
      },
      [EventNames.CreateServerAppModule]: {
        before: beforeCreateAppModule,
        after: afterCreateAppModule
      }
    };
  }
}

export default LushaPlugin;
