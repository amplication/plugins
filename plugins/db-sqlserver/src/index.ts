import {
  AmplicationPlugin,
  CreatePrismaSchemaParams,
  CreateServerDockerComposeDBParams,
  CreateServerDockerComposeParams,
  CreateServerDotEnvParams,
  CreateServerParams,
  DsgContext,
  EnumDataType,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { resolve } from "path";
import { getPluginSettings } from "./utils";
import { dataSource, updateDockerComposeDevProperties, updateDockerComposeProperties } from "./constants";

class MSSQLServerPlugin implements AmplicationPlugin {
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
    eventParams: CreateServerDotEnvParams
  ) {
    const { port, password, user, host, dbName } = getPluginSettings(
      context.pluginInstallations
    );

    eventParams.envVariables = [
      ...eventParams.envVariables,
      ...[
        { DB_USER: user },
        { DB_PASSWORD: password },
        { DB_PORT: port.toString() },
        { DB_NAME: dbName },
        {
          DB_URL: `sqlserver://${host}:${port};database=${dbName};user=${user};password=${password}`,
        },
      ],
    ];

    return eventParams;
  }

  beforeCreateServerDockerCompose(
    context: DsgContext,
    eventParams: CreateServerDockerComposeParams
  ) {
    eventParams.updateProperties.push(...updateDockerComposeProperties);
    return eventParams;
  }

  beforeCreateServerDockerComposeDev(
    context: DsgContext,
    eventParams: CreateServerDockerComposeDBParams
  ) {
    eventParams.updateProperties.push(...updateDockerComposeDevProperties);
    return eventParams;
  }

  beforeCreatePrismaSchema(
    context: DsgContext,
    eventParams: CreatePrismaSchemaParams
  ) {
    const { entities } = eventParams;
    entities.forEach((entity) => {
      entity.fields.forEach((field) => {
        if (field.customAttributes) {
          field.customAttributes = field.customAttributes.replace(
            /@([\w]+)\./g,
            `@${dataSource.name}.`
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

export default MSSQLServerPlugin;
