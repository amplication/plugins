import type { AmplicationPlugin, Events } from "@amplication/code-gen-types";

class FileUploadCorePlugin implements AmplicationPlugin {
  register(): Events {
    return {};
  }
}

export default FileUploadCorePlugin;
