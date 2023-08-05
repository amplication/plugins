import { CreateAdminUIParams, DsgContext, ModuleMap } from "@amplication/code-gen-types";
import { clientStaticPath, rulesPlaceholder } from "../constants";
import { format } from "prettier";
import { getPluginSettings } from "../utils";

export const afterCreateClient = async (
  context: DsgContext,
  eventParams: CreateAdminUIParams,
  modules: ModuleMap
): Promise<ModuleMap> => {
  const { rules } = getPluginSettings(
    context.pluginInstallations
  );

  const staticFiles = await context.utils.importStaticModules(
    clientStaticPath,
    context.clientDirectories.baseDirectory
  );

  staticFiles.replaceModulesCode(( code ) => 
    code.replaceAll(
      rulesPlaceholder, 
      format(JSON.stringify(rules, null, 2), { parser: "json" })
    ));

  await modules.merge(staticFiles);
  return modules;
};