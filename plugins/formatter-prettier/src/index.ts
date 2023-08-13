import { resolve } from "path";
import {
  DsgContext,
  AmplicationPlugin,
  Events,
  Module,
  EventNames,
  CreateServerParams,
  CreateServerPackageJsonParams,
  CreateAdminUIPackageJsonParams,
  ModuleMap,
  CreateAdminUIParams,
} from "@amplication/code-gen-types";
import { getPluginSettings } from "./utils";
import { format } from "prettier";

class PrettierPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServer]: {
        after: this.afterCreateApp("server").bind(this),
      },
      [EventNames.CreateAdminUI]: {
        after: this.afterCreateApp("client").bind(this),
      },
      [EventNames.CreateServerPackageJson]: {
        before: this.beforeCreatePackageJson,
      },
      [EventNames.CreateAdminUIPackageJson]: {
        before: this.beforeCreatePackageJson,
      },
    };
  }

  afterCreateApp = (
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
      let baseDirectory;
      const staticFilesPath = resolve(__dirname, "static");
      const rulesPlaceholder = "\"${{ RULES }}\"";

      console.log("rules", rules);
    
      switch (event) {
        case "server":
          baseDirectory = context.serverDirectories.baseDirectory;
          break;
  
        case "client":
          baseDirectory = context.clientDirectories.baseDirectory;
          break;
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

  beforeCreatePackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams | CreateAdminUIPackageJsonParams
  ): CreateServerPackageJsonParams | CreateAdminUIPackageJsonParams {
    const packageJsonValues = {
      devDependencies: {
        prettier: "^2.8.0",
      },
      scripts: {
        format: "prettier --write .",
      },
    };

    eventParams.updateProperties.push(packageJsonValues);  
    return eventParams;
  }
}

export default PrettierPlugin;
