import {
  CreateAdminUIParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { clientStaticPath } from "../constants";

export const afterCreateAdminApp = async (
  context: DsgContext,
  eventParams: CreateAdminUIParams,
  modules: ModuleMap
): Promise<ModuleMap> => {
  const staticFiles = await context.utils.importStaticModules(
    clientStaticPath,
    context.clientDirectories.srcDirectory
  );

  // Merge the static files with the existing modules replacing any existing files
  await modules.merge(staticFiles);
  return modules;
};
