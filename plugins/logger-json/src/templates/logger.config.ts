import { ConfigService } from "@nestjs/config";
import { Params } from "nestjs-pino";

ADDITIONAL_LOG_PROPERTIES_KEY;

const defaultSerializer = (
  data: Record<string, any>,
  config: {
    sensitiveKeys: string[];
    ignoredKeys: string[];
    logKeys: string[];
  },
) => {
  let tokenizedData = { ...data };

  for (const key of config.ignoredKeys) {
    if (tokenizedData[key]) {
      delete tokenizedData[key];
    }
  }

  for (const key of config.sensitiveKeys) {
    if (tokenizedData[key]) {
      tokenizedData[key] = "*****";
    }
  }

  tokenizedData = config.logKeys.length
    ? config.logKeys.reduce(
        (acc, key) => {
          if (tokenizedData[key]) {
            acc[key] = tokenizedData[key];
          }
          return acc;
        },
        {} as Record<string, any>,
      )
    : tokenizedData;

  return tokenizedData;
};

export const LoggerConfiguration = (configService: ConfigService): Params => {
  const logLevel = configService.getOrThrow("LOG_LEVEL");
  const serviceName = configService.getOrThrow("SERVICE_NAME") ?? "";
  const sensitiveRequestKeys =
    configService.get("SENSITIVE_REQUEST_KEYS")?.split(",") ?? [];
  const ignoredRequestKeys =
    configService.get("IGNORED_REQUEST_KEYS")?.split(",") ?? [];
  const logRequestKeys =
    configService.get("LOG_REQUEST_KEYS")?.split(",") ?? [];
  const sensitiveResponseKeys =
    configService.get("SENSITIVE_RESPONSE_KEYS")?.split(",") ?? [];
  const ignoredResponseKeys =
    configService.get("IGNORED_RESPONSE_KEYS")?.split(",") ?? [];
  const logResponseKeys =
    configService.get("LOG_RESPONSE_KEYS")?.split(",") ?? [];
  const logRequest = configService.get("LOG_REQUEST") === "true";

  const allowedLevels = ["fatal", "error", "warn", "info", "debug", "trace"];

  if (!allowedLevels.includes(logLevel)) {
    throw new Error(
      `${logLevel} is not a valid log level. Check your LOG_LEVEL env variable.`,
    );
  }

  return {
    pinoHttp: {
      level: logLevel,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
        },
      },
      serializers: {
        req: (data: any) => {
          return defaultSerializer(data, {
            sensitiveKeys: sensitiveRequestKeys,
            ignoredKeys: ignoredRequestKeys,
            logKeys: logRequestKeys,
          });
        },
        res: (data: any) => {
          return defaultSerializer(data, {
            sensitiveKeys: sensitiveResponseKeys,
            ignoredKeys: ignoredResponseKeys,
            logKeys: logResponseKeys,
          });
        },
      },
      redact: {
        remove: true,
        paths: logRequest ? [] : ["req", "res"],
      },
      mixin: () => ({ ...ADDITIONAL_LOG_PROPERTIES, serviceName }),
    },
  };
};
