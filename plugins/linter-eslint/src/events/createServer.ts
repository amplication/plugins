import { CreateServerParams, DsgContext, ModuleMap } from "@amplication/code-gen-types";
import { rulesPlaceholder, serverStaticPath } from "../constants";
import { getPluginSettings } from "../utils";
import { format } from "prettier";

export const afterCreateServer = async (
  context: DsgContext,
  eventParams: CreateServerParams,
  modules: ModuleMap
): Promise<ModuleMap> => {
  const { rules } = getPluginSettings(
    context.pluginInstallations
  );

  const staticFiles = await context.utils.importStaticModules(
    serverStaticPath,
    context.serverDirectories.baseDirectory
  );

  staticFiles.replaceModulesCode(( code ) => 
    code.replaceAll(
      rulesPlaceholder, 
      format(JSON.stringify(rules, null, 2), { parser: "json" })
    ));

  await modules.merge(staticFiles);
  return modules;
};