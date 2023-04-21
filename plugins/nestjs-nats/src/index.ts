import {
  AmplicationPlugin,
  CreateMessageBrokerClientOptionsFactoryParams,
  CreateMessageBrokerNestJSModuleParams,
  CreateMessageBrokerParams,
  CreateMessageBrokerServiceBaseParams,
  CreateMessageBrokerServiceParams,
  CreateServerAppModuleParams,
  CreateServerDockerComposeParams,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  DsgContext,
  Events,
  Module,
  ModuleMap,
} from "@amplication/code-gen-types";
import { parse, removeTSVariableDeclares } from "@amplication/code-gen-utils";
import { readFile } from "fs/promises";
import { merge } from "lodash";
import { join, resolve } from "path";
import { print } from "recast";
import { NATS_PORT, staticsPath, templatesPath } from "./constants";

class NatsPlugin implements AmplicationPlugin {
  static moduleFile: Module | undefined;
  /**
   * This is mandatory function that returns an object with the event name. Each event can have before or/and after
   */
  register(): Events {
    return {
      CreateServerDockerCompose: {
        before: this.beforeCrateServerDockerCompose,
      },
      CreateServerDotEnv: {
        before: this.beforeCreateServerDotEnv,
      },
      CreateServerPackageJson: {
        before: this.beforeCreateServerPackageJson,
      },

      CreateMessageBroker: {
        before: this.beforeCreateBroker,
      },
      CreateServerAppModule: {
        before: this.beforeCreateServerAppModule,
      },
      CreateMessageBrokerClientOptionsFactory: {
        after: this.afterCreateMessageBrokerClientOptionsFactory,
      },
      CreateMessageBrokerNestJSModule: {
        after: this.afterCreateMessageBrokerNestJSModule,
      },
      CreateMessageBrokerService: {
        after: this.afterCreateMessageBrokerService,
      },
      CreateMessageBrokerServiceBase: {
        after: this.afterCreateMessageBrokerServiceBase,
      },
    };
  }

  beforeCrateServerDockerCompose(
    context: DsgContext,
    eventParams: CreateServerDockerComposeParams
  ): CreateServerDockerComposeParams {
    const NATS_NAME = "nats";
    const NETWORK = "internal";
    const newParams = {
      services: {
        [NATS_NAME]: {
          image: "nats:2.9.15",
          networks: [NETWORK],
          ports: [`${NATS_PORT}:${NATS_PORT}`, "8222:8222"],
        },
      },
      networks: {
        internal: {
          name: NETWORK,
          driver: "bridge",
        },
      },
    };
    eventParams.updateProperties.push(newParams);
    return eventParams;
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams
  ): CreateServerDotEnvParams {
    const vars = {
      NATS_SERVERS: `localhost:${NATS_PORT}`,
    };
    const newEnvParams = [
      ...eventParams.envVariables,
      ...Object.entries(vars).map(([key, value]) => ({ [key]: value })),
    ];
    return { envVariables: newEnvParams };
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams
  ): CreateServerPackageJsonParams {
    const myValues = {
      dependencies: {
        "@nestjs/microservices": "^9.3.10",
        nats: "^2.13.1",
      },
    };
    eventParams.updateProperties.forEach((updateProperty) =>
      merge(updateProperty, myValues)
    );

    return eventParams;
  }

  async afterCreateMessageBrokerClientOptionsFactory(
    context: DsgContext,
    eventParams: CreateMessageBrokerClientOptionsFactoryParams
  ): Promise<ModuleMap> {
    const { serverDirectories, resourceInfo } = context;

    if (!resourceInfo) {
      throw new Error("Could not find resource info");
    }

    const { name } = resourceInfo;
    const fileName = "nats.module.factory.ts";
    const filePath = resolve(templatesPath, fileName);
    const file = await readFile(filePath, "utf8");

    const astFile = parse(file.replaceAll("SERVICE_NAME", name));
    removeTSVariableDeclares(astFile);

    const path = join(serverDirectories.messageBrokerDirectory, fileName);

    return new ModuleMap().set(path, { code: print(astFile).code, path });
  }
  beforeCreateServerAppModule(
    dsgContext: DsgContext,
    eventParams: CreateServerAppModuleParams
  ) {
    const file = NatsPlugin.moduleFile;
    if (!file) {
      throw new Error("Nats module file not found");
    }
    eventParams.modulesFiles.push(file);
    return eventParams;
  }

  async afterCreateMessageBrokerServiceBase(
    context: DsgContext,
    eventParams: CreateMessageBrokerServiceBaseParams
  ): Promise<ModuleMap> {
    const { serverDirectories } = context;
    const { messageBrokerDirectory } = serverDirectories;
    const fileName = "nats.service.base.ts";
    const filePath = resolve(staticsPath, fileName);

    const file = await readFile(filePath, "utf8");

    const path = join(messageBrokerDirectory, "base", fileName);
    return new ModuleMap().set(path, { code: file, path });
  }

  async afterCreateMessageBrokerService(
    context: DsgContext,
    eventParams: CreateMessageBrokerServiceParams
  ): Promise<ModuleMap> {
    const { serverDirectories } = context;
    const { messageBrokerDirectory } = serverDirectories;
    const fileName = "nats.service.ts";
    const filePath = resolve(staticsPath, fileName);

    const file = await readFile(filePath, "utf8");
    const path = join(messageBrokerDirectory, fileName);
    const controllerFileName = "nats.controller.ts";
    const controllerFilePath = resolve(staticsPath, controllerFileName);

    const controllerFile = await readFile(controllerFilePath, "utf8");
    const controllerPath = join(messageBrokerDirectory, fileName);

    const modules = new ModuleMap();
    modules.set(path, { code: file, path });
    modules.set(controllerPath, { code: controllerFile, path: controllerPath });
    return modules;
  }

  beforeCreateBroker(
    dsgContext: DsgContext,
    eventParams: CreateMessageBrokerParams
  ): CreateMessageBrokerParams {
    dsgContext.serverDirectories.messageBrokerDirectory = join(
      dsgContext.serverDirectories.srcDirectory,
      "nats"
    );
    return eventParams;
  }

  async afterCreateMessageBrokerNestJSModule(
    context: DsgContext,
    eventParams: CreateMessageBrokerNestJSModuleParams
  ): Promise<ModuleMap> {
    const fileName = "nats.module.ts";
    const filePath = resolve(staticsPath, fileName);

    const { serverDirectories } = context;
    const { messageBrokerDirectory } = serverDirectories;
    const file = await readFile(filePath, "utf8");

    NatsPlugin.moduleFile = {
      code: file,
      path: join(messageBrokerDirectory, fileName),
    };
    const modules = new ModuleMap();
    modules.set(NatsPlugin.moduleFile.path, NatsPlugin.moduleFile);
    return modules;
  }
}

export default NatsPlugin;
