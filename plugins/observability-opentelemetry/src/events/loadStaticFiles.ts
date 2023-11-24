import {
  DsgContext,
  LoadStaticFilesParams,
  ModuleMap,
} from "@amplication/code-gen-types";
import { getPluginSettings } from "@utils/getPluginSettings";
import { placeholders, staticPath } from "@/constants";

export const afterLoadStaticFiles = async (
  context: DsgContext,
  eventParams: LoadStaticFilesParams,
  modules: ModuleMap,
): Promise<ModuleMap> => {
  const { OTEL_COLLECTOR_PORT_GRPC, OTEL_COLLECTOR_PORT_HTTP } =
    getPluginSettings(context.pluginInstallations);

  const staticFiles = await context.utils.importStaticModules(
    staticPath,
    context.serverDirectories.baseDirectory,
  );

  staticFiles.replaceModulesCode((_path, code) =>
    code
      .replaceAll(placeholders.otelAgentGrpcEndpoint, OTEL_COLLECTOR_PORT_GRPC)
      .replaceAll(placeholders.otelAgentHttpEndpoint, OTEL_COLLECTOR_PORT_HTTP),
  );

  await modules.merge(staticFiles);

  return modules;
};
