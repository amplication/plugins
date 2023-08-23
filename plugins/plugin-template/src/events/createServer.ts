import type {
  CreateServerParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { resolve } from "path";

const beforeCreateServer = (
  context: DsgContext,
  eventParams: CreateServerParams
) => {
  // Here you can manipulate the context or save any context variable for your after function.
  // You can also manipulate the eventParams so it will change the result of Amplication function.
  // context.utils.skipDefaultBehavior = true; this will prevent the default behavior and skip our handler.

  return eventParams; // eventParams must return from before function. It will be used for the builder function.
};

const afterCreateServer = async (
  context: DsgContext,
  eventParams: CreateServerParams,
  modules: ModuleMap
): Promise<ModuleMap> => {
  // Here you can get the context, eventParams and the modules that Amplication created.
  // Then you can manipulate the modules, add new ones, or create your own.
  const staticPath = resolve(__dirname, "./static");
  const staticsFiles = await context.utils.importStaticModules(
    staticPath,
    context.serverDirectories.srcDirectory
  );
  await modules.merge(staticsFiles);
  return modules; // You must return the generated modules you want to generate at this part of the build.
};

export { beforeCreateServer, afterCreateServer };
