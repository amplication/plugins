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
import {
  dataSource,
  updateDockerComposeDevProperties,
  updateDockerComposeProperties,
} from "./constants";

class MySQLPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      CreateServer: {
        before: this.beforeCreateServer,
      },
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

  beforeCreateServer(context: DsgContext, eventParams: CreateServerParams) {
    const generateErrorMessage = (
      entityName: string,
      fieldName: string,
    ) => `MultiSelectOptionSet (list of primitives type) on entity: ${entityName}, field: ${fieldName}, is not supported by MySQL prisma provider. 
    You can select another data type or change your DB to PostgreSQL`;

    context.entities?.forEach(({ name: entityName, fields }) => {
      const field = fields.find(
        ({ dataType }) => dataType === EnumDataType.MultiSelectOptionSet,
      );
      if (field) {
        context.logger.error(generateErrorMessage(entityName, field.name));
        throw new Error(generateErrorMessage(entityName, field.name));
      }
    });

    return eventParams;
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
        { DB_USER: user },
        { DB_PASSWORD: password },
        { DB_PORT: port.toString() },
        { DB_NAME: dbName },
        {
          DB_URL: `mysql://${user}:${password}@${host}:${port}/${dbName}`,
        },
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

export default MySQLPlugin;
