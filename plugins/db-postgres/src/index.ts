import {
  AmplicationPlugin,
  CreatePrismaSchemaParams,
  CreateServerDockerComposeDBParams,
  CreateServerDockerComposeParams,
  CreateServerDotEnvParams,
  DsgContext,
  Events,
  ModuleMap,
  PluginInstallation,
} from "@amplication/code-gen-types";
import { resolve } from "path";
import {
  dataSource,
  updateDockerComposeDevProperties,
  updateDockerComposeProperties,
} from "./constants";
import { getPluginSettings } from "./utils";

class PostgresPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      CreateServerDotEnv: {
        before: this.beforeCreateServerDotEnv,
      },
      CreateServerDockerCompose: {
        before: this.beforeCreateServerDockerCompose,
      },
      CreateServerDockerComposeDev: {
        before: this.beforeCreateServerDockerComposeDev,
      },
      CreatePrismaSchema: {
        before: this.beforeCreatePrismaSchema,
      },
    };
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams,
  ) {
    const { port, password, user, host, dbName } = getPluginSettings(
      context.pluginInstallations,
    );

    eventParams.envVariables = [
      ...eventParams.envVariables,
      ...[
        {
          DB_URL: `postgres://${user}:${password}@${host}:${port}/${dbName}`,
        },
        { DB_USER: user },
        { DB_PASSWORD: password },
        { DB_PORT: port.toString() },
        { DB_NAME: dbName },
      ],
    ];

    return eventParams;
  }

  beforeCreateServerDockerCompose(
    context: DsgContext,
    eventParams: CreateServerDockerComposeParams,
  ) {
    eventParams.updateProperties.push(...updateDockerComposeProperties);
    return eventParams;
  }

  beforeCreateServerDockerComposeDev(
    context: DsgContext,
    eventParams: CreateServerDockerComposeDBParams,
  ) {
    eventParams.updateProperties.push(...updateDockerComposeDevProperties);
    return eventParams;
  }

  beforeCreatePrismaSchema(
    context: DsgContext,
    eventParams: CreatePrismaSchemaParams,
  ) {
    const { entities } = eventParams;
    entities.forEach((entity) => {
      entity.fields.forEach((field) => {
        if (field.customAttributes) {
          field.customAttributes = field.customAttributes.replace(
            /@([\w]+)\./g,
            `@${dataSource.name}.`,
          );
        }
      });
    });

    return {
      ...eventParams,
      dataSource: dataSource,
    };
  }
}

export default PostgresPlugin;
