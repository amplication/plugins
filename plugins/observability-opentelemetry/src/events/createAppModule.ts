import {
  CreateServerAppModuleParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { addImports, callExpression, importNames } from "@utils/ast";
import { getPluginSettings } from "@utils/getPluginSettings";
import { namedTypes, builders } from "ast-types";
import { identifiers } from "@/constants";

const {
  OPEN_TELEMETRY_MODULE,
  BATCH_SPAN_PROCESSOR,
  CONTROLLER_INJECTOR,
  EVENT_EMITTER_INJECTOR,
  GRAPHQL_RESOLVER_INJECTOR,
  GUARD_INJECTOR,
  HTTP_INSTRUMENTATION,
  OTLP_TRACE_EXPORTER,
  PIPE_INJECTOR,
} = identifiers;

const opentelemetryModule = (serviceName: string) => {
  try {
    const expression = callExpression`
      ${OPEN_TELEMETRY_MODULE}.forRoot({
        serviceName: "${serviceName}",
        spanProcessor: new ${BATCH_SPAN_PROCESSOR}(new ${OTLP_TRACE_EXPORTER}()),
        instrumentations: [
          new ${HTTP_INSTRUMENTATION}({
            requestHook: (span, request) => {
              if (request.method)
                span.setAttribute("http.method", request.method);
            },
          }),
        ],

        traceAutoInjectors: [
          ${CONTROLLER_INJECTOR},
          ${EVENT_EMITTER_INJECTOR},
          ${GRAPHQL_RESOLVER_INJECTOR},
          ${GUARD_INJECTOR},
          ${PIPE_INJECTOR},
        ]
      })
    `;

    return expression;
  } catch (error) {
    console.log(error);
  }
};

const generateImports = (): namedTypes.ImportDeclaration[] => {
  return [
    importNames(
      [
        OPEN_TELEMETRY_MODULE,
        PIPE_INJECTOR,
        CONTROLLER_INJECTOR,
        EVENT_EMITTER_INJECTOR,
        GRAPHQL_RESOLVER_INJECTOR,
        GUARD_INJECTOR,
      ],
      "@amplication/opentelemetry-nestjs"
    ),
    importNames([HTTP_INSTRUMENTATION], "@opentelemetry/instrumentation-http"),
    importNames(
      [OTLP_TRACE_EXPORTER],
      "@opentelemetry/exporter-trace-otlp-grpc"
    ),
    importNames([BATCH_SPAN_PROCESSOR], "@opentelemetry/sdk-trace-base"),
  ];
};

export const beforeCreateServerAppModule = (
  context: DsgContext,
  eventParams: CreateServerAppModuleParams
): CreateServerAppModuleParams => {
  const { templateMapping, template } = eventParams;

  const { serviceName } = getPluginSettings(context.pluginInstallations);

  templateMapping["MODULES"] = builders.arrayExpression([
    ...templateMapping["MODULES"].elements,
    opentelemetryModule(serviceName || context.resourceInfo?.name || "sample-service"),
  ]);

  addImports(template, generateImports());

  return eventParams;
};
