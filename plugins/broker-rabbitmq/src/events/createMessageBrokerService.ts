import {
  CreateMessageBrokerServiceParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { resolve } from "path";

export async function afterCreateMessageBrokerService(
  context: DsgContext,
  eventParams: CreateMessageBrokerServiceParams
): Promise<ModuleMap> {
  const { serverDirectories } = context;
  const { messageBrokerDirectory } = serverDirectories;

  const staticPath = resolve(__dirname, "./static/");

  const staticFiles = await context.utils.importStaticModules(
    staticPath,
    messageBrokerDirectory
  );

  return staticFiles;
}
