import {
  EventNames,
  type AmplicationPlugin,
  type Events,
} from "@amplication/code-gen-types";
import {
  afterCreateServer,
  beforeCreateEntityService,
  beforeCreateServerGitIgnore,
} from "./events";

class FileUploadLocalPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServer]: {
        after: afterCreateServer,
      },
      [EventNames.CreateEntityService]: {
        before: beforeCreateEntityService,
      },
      [EventNames.CreateEntityServiceBase]: {},
      [EventNames.CreateServerGitIgnore]: {
        before: beforeCreateServerGitIgnore,
      },
    };
  }
}

export default FileUploadLocalPlugin;
