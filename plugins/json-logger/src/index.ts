import type {
  AmplicationPlugin,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { JsonLoggerService } from "./json-logger.service";
import { ConfigModule, ConfigService } from "@nestjs/config"; // Import ConfigModule and ConfigService

class ExamplePlugin implements AmplicationPlugin {
  constructor(private readonly configService: ConfigService) {} // Inject the ConfigService

  /**
   * This is a mandatory function that returns an object with the event names. Each event can have before and/or after.
   */
  register(): Events {
    return {
      [EventNames.CreateServerAppModule]: {
        before: this.beforeCreateServerAppModule,
        after: this.afterCreateServerAppModule,
      },
      [EventNames.CreateAdminUI]: {
        before: this.beforeCreateAdminUI,
      },
    };
  }

  beforeCreateServerAppModule(context: DsgContext, eventParams: any) {
    // Get log level and additional properties from configuration
    const logLevel = this.configService.get("settings.logLevel");
    const additionalLogProperties = this.configService.get("settings.additionalLogProperties");

    // Here you can use the JSON logger to log a message with log level and additional properties
    const jsonLogger = context.container.get(JsonLoggerService);
    jsonLogger.log("Before CreateServerAppModule event", "ExamplePlugin", {
      logLevel,
      additionalLogProperties,
    });

    // Return the eventParams without modification
    return eventParams;
  }

  async afterCreateServerAppModule(
    context: DsgContext,
    eventParams: any,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    // Here you can use the JSON logger to log a message
    const jsonLogger = context.container.get(JsonLoggerService);
    jsonLogger.log("After CreateServerAppModule event", "ExamplePlugin");

    // Return the modules without modification
    return modules;
  }

  beforeCreateAdminUI(context: DsgContext, eventParams: any) {
    // Here you can use the JSON logger to log a message
    const jsonLogger = context.container.get(JsonLoggerService);
    jsonLogger.log("Before CreateAdminUI event", "ExamplePlugin");

    // Return the eventParams without modification
    return eventParams;
  }
}

export default ExamplePlugin;
