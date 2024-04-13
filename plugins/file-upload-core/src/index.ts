import {
  EventNames,
  type AmplicationPlugin,
  type Events,
} from "@amplication/code-gen-types";
import {
  afterCreateServer,
  afterCreateServerAppModule,
  beforCreateMainFile,
  beforeCreateEntityControllerBase,
  beforeCreateEntityModuleBase,
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
      [EventNames.CreateMainFile]: {
        before: beforCreateMainFile,
      },
      [EventNames.CreateEntityModuleBase]: {
        before: beforeCreateEntityModuleBase,
      },
      [EventNames.CreateEntityControllerBase]: {
        before: beforeCreateEntityControllerBase,
      },
      [EventNames.CreateEntityResolverBase]: {},
    };
  }
}

export default FileUploadCorePlugin;
