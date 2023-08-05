import { CreateAdminUIParams, DsgContext, ModuleMap } from "@amplication/code-gen-types";
import { clientStaticPath } from "../constants";

export const afterCreateClient = async (
  context: DsgContext,
  eventParams: CreateAdminUIParams,
  modules: ModuleMap
): Promise<ModuleMap> => {
  const staticsFiles = await context.utils.importStaticModules(
    clientStaticPath,
    context.clientDirectories.baseDirectory
  );
  await modules.merge(staticsFiles);
  return modules;
};