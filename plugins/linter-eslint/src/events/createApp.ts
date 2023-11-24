import {
  CreateAdminUIParams,
  CreateServerParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { clientStaticPath, serverStaticPath } from "../constants";
import { format } from "prettier";
import { getPluginSettings } from "../utils";

export const afterCreateApp = (event: "server" | "client") => {
  return async (
    context: DsgContext,
    eventParams: CreateAdminUIParams | CreateServerParams,
    modules: ModuleMap
  ): Promise<ModuleMap> => {
    const { rules, formatter } = getPluginSettings(context.pluginInstallations);
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

    const extendsValue = formatter === "prettier" ? "prettier" : null;

    staticFiles.modules().forEach((module) => {
      console.log(module.path);

      if (module.path.endsWith(".eslintrc")) {
        const code = format(
          JSON.stringify(
            {
              ...JSON.parse(module.code),
              extends: extendsValue
                ? JSON.parse(module.code).extends.concat(extendsValue)
                : JSON.parse(module.code).extends,
              rules: rules,
            },
            null,
            2
          ),
          { parser: "json" }
        );

        module.code = code;
      }
    });

    await modules.merge(staticFiles);
    return modules;
  };
};

export default afterCreateApp;
