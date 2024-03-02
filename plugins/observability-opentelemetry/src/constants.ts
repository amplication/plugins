import { builders } from "ast-types";
import { join } from "path";

export const staticPath = join(__dirname, "static");

export const placeholders = {
  serviceName: "${{ SERVICE_NAME }}",
  otelAgentGrpcEndpoint: "${{ OTEL_AGENT_GRPC_ENDPOINT }}",
  otelAgentHttpEndpoint: "${{ OTEL_AGENT_HTTP_ENDPOINT }}",
  jaegerAgentPort: "${{ JAEGER_AGENT_PORT }}",
};

export const packageJsonValues = {
  dependencies: {
    "@amplication/opentelemetry-nestjs": "^4.5.0",
  },
};

const JAEGER_NAME = "jaeger";
const OTEL_NAME = "opentelemetry";

export const dockerComposeDevValues = [
  {
    services: {
      [JAEGER_NAME]: {
        image: "jaegertracing/all-in-one:latest",
        ports: [
          "${JAEGER_AGENT_PORT}:${JAEGER_AGENT_PORT}", // Jaeger agent UI
          "14268:14268",
          "14250:4317",
        ],
      },
      [OTEL_NAME]: {
        image: "otel/opentelemetry-collector:latest",
        ports: [
          "${OTEL_COLLECTOR_PORT_GRPC}:${OTEL_COLLECTOR_PORT_GRPC}", // gRPC
          "${OTEL_COLLECTOR_PORT_HTTP}:${OTEL_COLLECTOR_PORT_HTTP}", // HTTP
          "1888:1888", // pprof extension
          "13133:13133", // health check extension
          "55670:55679", // zpages debugging extension
        ],
        volumes: ["./otel-config.yml:/etc/otel-config.yml"],
        command: ["--config=/etc/otel-config.yml"],
        depends_on: [JAEGER_NAME],
      },
    },
  },
];

export const dockerComposeValues = [
  {
    services: {
      server: {
        environment: {
          JAEGER_AGENT_HOST: "${JAEGER_AGENT_HOST}",
          JAEGER_AGENT_PORT: "${JAEGER_AGENT_PORT}",
          OTEL_COLLECTOR_HOST: "${OTEL_COLLECTOR_HOST}",
          OTEL_COLLECTOR_PORT_GRPC: "${OTEL_COLLECTOR_PORT_GRPC}",
          OTEL_COLLECTOR_PORT_HTTP: "${OTEL_COLLECTOR_PORT_HTTP}",
          OTEL_EXPORTER_OTLP_ENDPOINT: "${OTEL_EXPORTER_OTLP_ENDPOINT}",
        },
      },
      ...dockerComposeDevValues[0].services,
    },
  },
];

export const identifiers = {
  OPEN_TELEMETRY_MODULE: builders.identifier("OpenTelemetryModule"),
  BATCH_SPAN_PROCESSOR: builders.identifier("BatchSpanProcessor"),
  OTLP_TRACE_EXPORTER: builders.identifier("OTLPTraceExporter"),
  HTTP_INSTRUMENTATION: builders.identifier("HttpInstrumentation"),
  CONTROLLER_INJECTOR: builders.identifier("ControllerInjector"),
  GRAPHQL_RESOLVER_INJECTOR: builders.identifier("GraphQLResolverInjector"),
  EVENT_EMITTER_INJECTOR: builders.identifier("EventEmitterInjector"),
  GUARD_INJECTOR: builders.identifier("GuardInjector"),
  PIPE_INJECTOR: builders.identifier("PipeInjector"),
};
