import type {
  AmplicationPlugin,
  CreateMessageBrokerParams,
  DsgContext,
  Events,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import {
  beforeCreateAppModule,
  beforeCreateDockerComposeFile,
  beforeCreateServerDotEnv,
  beforeCreateServerPackageJson,
} from "./events";
import { join } from "path";

class MQTTBrokerPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServerDotEnv]: {
        before: beforeCreateServerDotEnv,
      },
      [EventNames.CreateServerPackageJson]: {
        before: beforeCreateServerPackageJson,
      },
      [EventNames.CreateServerDockerCompose]: {
        before: beforeCreateDockerComposeFile("PROD"),
      },
      [EventNames.CreateServerDockerComposeDev]: {
        before: beforeCreateDockerComposeFile("DEV"),
      },
      [EventNames.CreateServerAppModule]: {
        before: beforeCreateAppModule,
      },
      [EventNames.CreateMessageBroker]: {
        before: this.beforeCreateBroker,
      },
    };
  }

  beforeCreateBroker(
    dsgContext: DsgContext,
    eventParams: CreateMessageBrokerParams,
  ): CreateMessageBrokerParams {
    dsgContext.serverDirectories.messageBrokerDirectory = join(
      dsgContext.serverDirectories.srcDirectory,
      "mqtt",
    );
    return eventParams;
  }
}

export default MQTTBrokerPlugin;
