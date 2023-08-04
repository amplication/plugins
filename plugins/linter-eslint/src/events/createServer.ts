import { CreateServerParams, DsgContext, ModuleMap } from "@amplication/code-gen-types";
import { staticsPath } from "../constants";

export const afterCreateServer = async (
  context: DsgContext,
  eventParams: CreateServerParams,
  modules: ModuleMap
): Promise<ModuleMap> => {
  const staticsFiles = await context.utils.importStaticModules(
    staticsPath,
    context.serverDirectories.baseDirectory
  );
  await modules.merge(staticsFiles);
  return modules;
}