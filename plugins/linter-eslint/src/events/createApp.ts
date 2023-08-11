import { CreateAdminUIParams, CreateServerParams, DsgContext, ModuleMap } from "@amplication/code-gen-types";
import { clientStaticPath, rulesPlaceholder, serverStaticPath } from "../constants";
import { format } from "prettier";
import { getPluginSettings } from "../utils";

export const afterCreateApp = (
  event: "server" | "client",
) => {
  return async (
    context: DsgContext,
    eventParams: CreateAdminUIParams | CreateServerParams,
    modules: ModuleMap,
  ): Promise<ModuleMap> => {
    const { rules } = getPluginSettings(
      context.pluginInstallations
    );
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
    staticFiles.replaceModulesCode(( code ) => 
      code.replaceAll(
        rulesPlaceholder, 
        format(JSON.stringify(rules, null, 2), { parser: "json" })
      ));
  
    await modules.merge(staticFiles);
    return modules;
  };
};

export default afterCreateApp;