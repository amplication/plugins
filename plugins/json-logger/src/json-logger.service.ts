import { Injectable, LoggerService } from "@nestjs/common";
import { ConfigService } from "@nestjs/config"; // Import the ConfigService

@Injectable()
export class JsonLoggerService implements LoggerService {
  constructor(private readonly configService: ConfigService) {}

  log(message: any, context?: string, additionalProperties?: Record<string, any>) {
    this.logJson("info", message, context, additionalProperties);
  }

  error(message: any, trace?: string, context?: string, additionalProperties?: Record<string, any>) {
    this.logJson("error", message, context, additionalProperties);
  }

  warn(message: any, context?: string, additionalProperties?: Record<string, any>) {
    this.logJson("warn", message, context, additionalProperties);
  }

  debug(message: any, context?: string, additionalProperties?: Record<string, any>) {
    this.logJson("debug", message, context, additionalProperties);
  }

  verbose(message: any, context?: string, additionalProperties?: Record<string, any>) {
    this.logJson("verbose", message, context, additionalProperties);
  }

  private logJson(level: string, message: any, context?: string, additionalProperties?: Record<string, any>) {
    const logObject = {
      level,
      timestamp: new Date().toISOString(),
      message,
      context,
      serviceName: this.configService.get("serviceName"), // Get service name from config
      ...additionalProperties, // Merge additional properties into log object
    };
    console.log(JSON.stringify(logObject));
  }
}
