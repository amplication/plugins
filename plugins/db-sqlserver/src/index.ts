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
    const generateErrorMessageForEnums = (
      fieldType: string,
      entityName: string,
      fieldName: string
    ) => `${fieldType} (list of primitives type) on entity: ${entityName}, field: ${fieldName}, is not supported by SQL Server prisma provider. 
    You can select another data type or change your DB to PostgreSQL`;

    const generateErrorMessageForJson = (
      entityName: string,
      fieldName: string
    ) => `field type JSON on entity: ${entityName}, field: ${fieldName}, is not supported by SQL Server prisma provider. 
    You can select another data type or change your DB provider`;

    context.entities?.forEach(({ name: entityName, fields }) => {
      const enumField = fields.find(
        ({ dataType }) => dataType === EnumDataType.MultiSelectOptionSet || dataType === EnumDataType.OptionSet
      );
      if (enumField) {
        const errorMessage = generateErrorMessageForEnums(enumField.dataType as string, entityName, enumField.name);
        context.logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      const jsonField = fields.find(
        ({ dataType }) => dataType === EnumDataType.Json);
      if (jsonField) {
        const errorMessage = generateErrorMessageForJson(entityName, jsonField.name);
        context.logger.error(errorMessage);
        throw new Error(errorMessage);
      }
    });

    return eventParams;
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
