import { DsgContext, ModuleMap } from "@amplication/code-gen-types";

export async function getStaticFiles(
  context: DsgContext,
  basePath: string,
  staticPath: string
): Promise<ModuleMap> {
  const staticFiles = await context.utils.importStaticModules(
    staticPath,
    basePath
  );

  return staticFiles;
}
