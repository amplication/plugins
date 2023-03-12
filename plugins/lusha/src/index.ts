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
import { afterCreateServerModules } from "./events/createServerModules";
import { afterCreateEntityModule } from "./events/createEntityModule";
import { beforeCreateAppModule, afterCreateAppModule } from "./events/createAppModule";
import { afterLoadStaticFiles } from "./events/loadStaticFiles";
import { afterCreateDTOs } from "./events/createDTOs";

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
      [EventNames.CreateServerAppModule]: {
        before: beforeCreateAppModule,
        after: afterCreateAppModule
      },
      [EventNames.LoadStaticFiles]: {
        after: afterLoadStaticFiles
      },
      [EventNames.CreateDTOs]: {
        after: afterCreateDTOs
      }
    };
  }
}

export default LushaPlugin;
