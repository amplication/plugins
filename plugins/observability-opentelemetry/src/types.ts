export interface Settings {
  serviceName: string | undefined;
  OTEL_COLLECTOR_PORT_GRPC: string;
  OTEL_COLLECTOR_PORT_HTTP: string;
  JAEGER_AGENT_PORT: string;
}
