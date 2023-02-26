import { AmplicationPlugin, Events } from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import {
  beforeCreateEntityController,
  afterCreateEntityController,
} from "./events/createController";
import {
  beforeCreateEntityService,
  afterCreateEntityService,
} from "./events/createService";
import { afterCreateServerModules } from "./events/createDTOs";
import { afterCreateEntityModule, afterCreatePrismaSchemaModule } from "./events/createEntityModule";
import { beforeCreateAppModule, afterCreateAppModule } from "./events/createAppModule";

class LushaPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateEntityController]: {
        before: beforeCreateEntityController,
        after: afterCreateEntityController,
      },
      [EventNames.CreateEntityService]: {
        before: beforeCreateEntityService,
        after: afterCreateEntityService,
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
