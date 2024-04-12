import {
  EventNames,
  type AmplicationPlugin,
  type Events,
} from "@amplication/code-gen-types";
import {
  afterCreateServer,
  afterCreateServerAppModule,
  beforeCreateServerAppModule,
  beforeCreateServerPackageJson,
} from "./events";

class FileUploadCorePlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServerPackageJson]: {
        before: beforeCreateServerPackageJson,
      },
      [EventNames.CreateServerAppModule]: {
        before: beforeCreateServerAppModule,
        after: afterCreateServerAppModule,
      },
      [EventNames.CreateServer]: {
        after: afterCreateServer,
      },
    };
  }
}

export default FileUploadCorePlugin;
