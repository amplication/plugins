import {
  CreateAdminUIParams,
  CreateServerParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { clientStaticPath, serverStaticPath } from "../constants";

export const afterCreateApp = (event: "server" | "client") => {
  return async (
    context: DsgContext,
    eventParams: CreateAdminUIParams | CreateServerParams,
    modules: ModuleMap
  ): Promise<ModuleMap> => {
    let staticFilesPath, baseDirectory;

    switch (event) {
      case "server":
        staticFilesPath = serverStaticPath;
        baseDirectory = context.serverDirectories.baseDirectory;
        break;

      case "client":
        staticFilesPath = clientStaticPath;
        baseDirectory = context.clientDirectories.baseDirectory;
    }

    const staticFiles = await context.utils.importStaticModules(
      staticFilesPath,
      baseDirectory
    );

    await modules.merge(staticFiles);
    return modules;
  };
};

export default afterCreateApp;
