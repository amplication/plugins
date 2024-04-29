import {
  EventNames,
  type AmplicationPlugin,
  type Events,
} from "@amplication/code-gen-types";
import {
  afterCreateServer,
  beforeCreateEntityService,
  beforeCreateEntityServiceBase,
  beforeCreateServer,
  beforeCreateServerGitIgnore,
} from "./events";

class FileUploadLocalPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServer]: {
        before: beforeCreateServer,
        after: afterCreateServer,
      },
      [EventNames.CreateEntityService]: {
        before: beforeCreateEntityService,
      },
      [EventNames.CreateEntityServiceBase]: {
        before: beforeCreateEntityServiceBase,
      },
      [EventNames.CreateServerGitIgnore]: {
        before: beforeCreateServerGitIgnore,
      },
    };
  }
}

export default FileUploadLocalPlugin;
