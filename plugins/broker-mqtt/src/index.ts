import type {
  AmplicationPlugin,
  CreateMessageBrokerParams,
  DsgContext,
  Events,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import {
  afterCreateMessageBrokerClientOptionsFactory,
  afterCreateMessageBrokerNestJSModule,
  afterCreateMessageBrokerService,
  afterCreateTopicsEnum,
  beforeCreateAppModule,
  beforeCreateConnectMicroservices,
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
      [EventNames.CreateMessageBrokerNestJSModule]: {
        after: afterCreateMessageBrokerNestJSModule,
      },
      [EventNames.CreateMessageBrokerService]: {
        after: afterCreateMessageBrokerService,
      },
      [EventNames.CreateMessageBrokerClientOptionsFactory]: {
        after: afterCreateMessageBrokerClientOptionsFactory,
      },
      [EventNames.CreateConnectMicroservices]: {
        before: beforeCreateConnectMicroservices,
      },
      [EventNames.CreateMessageBrokerTopicsEnum]: {
        after: afterCreateTopicsEnum,
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
