import {
  CreateServerParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { serverStaticsPath } from "../constants";

export const afterCreateServer = async (
  context: DsgContext,
  eventParams: CreateServerParams,
  modules: ModuleMap,
) => {
  const { utils } = context;

  const staticFiles = await utils.importStaticModules(
    serverStaticsPath,
    context.serverDirectories.srcDirectory,
  );

  await modules.merge(staticFiles);

  return modules;
};
