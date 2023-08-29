import { CreateServerDotEnvParams, DsgContext } from "@amplication/code-gen-types";
import { beforeCreateServerDotEnv } from "@events/createDotEnv";
import { mock } from "jest-mock-extended";

describe("Testing beforeCreateServerDotEnv hook", () => {
  let context: DsgContext;
  let eventParams: CreateServerDotEnvParams;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [{
        npm: "@amplication/plugin-integrate-opentelemetry",
      }],
    });
    eventParams = mock<CreateServerDotEnvParams>({
      envVariables: [],
    });
  });

  it("should use default values if plugin settings are not defined", () => {
    eventParams = beforeCreateServerDotEnv(context, eventParams);

    const expectedEnvVariables = [
      { OTEL_COLLECTOR_HOST: "localhost" },
      { OTEL_COLLECTOR_PORT_GRPC: "4317" },
      { OTEL_COLLECTOR_PORT_HTTP: "4318" },
      {
        OTEL_EXPORTER_OTLP_ENDPOINT: "http://${OTEL_COLLECTOR_HOST}:${OTEL_COLLECTOR_PORT_HTTP}"
      },
      { JAEGER_AGENT_HOST: "jaeger" },
      { JAEGER_AGENT_PORT: "16686" }
    ];

    expect(eventParams.envVariables).toEqual(expectedEnvVariables);
  });

  it("should use plugin settings if defined", () => {
    context.pluginInstallations[0].settings = {
      JAEGER_AGENT_PORT: 1234,
      OTEL_COLLECTOR_PORT_GRPC: 1235,
      OTEL_COLLECTOR_PORT_HTTP: 1236,
    };

    eventParams = beforeCreateServerDotEnv(context, eventParams);

    const expectedEnvVariables = [
      { OTEL_COLLECTOR_HOST: "localhost" },
      { OTEL_COLLECTOR_PORT_GRPC: "1235" },
      { OTEL_COLLECTOR_PORT_HTTP: "1236" },
      {
        OTEL_EXPORTER_OTLP_ENDPOINT: "http://${OTEL_COLLECTOR_HOST}:${OTEL_COLLECTOR_PORT_HTTP}"
      },
      { JAEGER_AGENT_HOST: "jaeger" },
      { JAEGER_AGENT_PORT: "1234" }
    ];

    expect(eventParams.envVariables).toEqual(expectedEnvVariables);
  });
});