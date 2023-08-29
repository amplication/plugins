import { CreateServerDotEnvParams, DsgContext } from "@amplication/code-gen-types";
import { getPluginSettings, convertToVarDict } from "@utils/index";

export const beforeCreateServerDotEnv = (
  context: DsgContext,
  eventParams: CreateServerDotEnvParams
) => {
  const { JAEGER_AGENT_PORT, OTEL_COLLECTOR_PORT_GRPC, OTEL_COLLECTOR_PORT_HTTP } = getPluginSettings(context.pluginInstallations);

  const envVariables = {
    // OpenTelemetry Collector
    OTEL_COLLECTOR_HOST: "localhost",
    OTEL_COLLECTOR_PORT_GRPC: OTEL_COLLECTOR_PORT_GRPC,
    OTEL_COLLECTOR_PORT_HTTP: OTEL_COLLECTOR_PORT_HTTP,
    OTEL_EXPORTER_OTLP_ENDPOINT: "http://${OTEL_COLLECTOR_HOST}:${OTEL_COLLECTOR_PORT_HTTP}",

    // Jaeger
    JAEGER_AGENT_HOST: "jaeger",
    JAEGER_AGENT_PORT: JAEGER_AGENT_PORT,
  };

  eventParams.envVariables = eventParams.envVariables.concat(
    convertToVarDict(envVariables)
  );

  return eventParams;
};