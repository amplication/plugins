import {
  EventNames,
  type AmplicationPlugin,
  type Events,
} from "@amplication/code-gen-types";
import { beforeCreateServerPackageJson } from "./events";

class FileUploadCorePlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServerPackageJson]: {
        before: beforeCreateServerPackageJson,
      },
    };
  }
}

export default FileUploadCorePlugin;
