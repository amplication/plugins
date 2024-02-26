import { ConfigService } from "@nestjs/config";
import { Params } from "nestjs-pino";

ADDITIONAL_LOG_PROPERTIES_KEY;

export const LoggerConfiguration = (configService: ConfigService): Params => {
  const logLevel = configService.getOrThrow("LOG_LEVEL");
  const serviceName = configService.getOrThrow("SERVICE_NAME") ?? "";
  const sensitiveKeys = configService.get("SENSITIVE_KEYS")?.split(",") ?? [];
  const logRequest = configService.get("LOG_REQUEST") === "true";
  const pinoPretty = configService.get("PINO_PRETTY") === "true";

  const allowedLevels = ["fatal", "error", "warn", "info", "debug", "trace"];

  if (!allowedLevels.includes(logLevel)) {
    throw new Error(
      `${logLevel} is not a valid log level. Check your LOG_LEVEL env variable.`,
    );
  }

  return {
    pinoHttp: {
      level: logLevel,
      transport: pinoPretty
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              ignore: "pid,hostname",
            },
          }
        : undefined,
      redact: {
        paths: logRequest ? sensitiveKeys : ["req", "res"],
        remove: logRequest ? false : true,
        censor: "********",
      },
      mixin: () => ({ ...ADDITIONAL_LOG_PROPERTIES, serviceName }),
    },
  };
};
