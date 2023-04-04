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
  PluginInstallation,
} from "@amplication/code-gen-types";
import { merge } from "lodash";
import { resolve } from "path";
import defaultSettings from "../.amplicationrc.json";
import { name } from "../package.json";
import { dataSource, updateDockerComposeProperties } from "./constants";
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
      CreateServerDockerComposeDB: {
        before: this.beforeCreateServerDockerComposeDB,
        after: this.afterCreateServerDockerComposeDB,
      },
      CreatePrismaSchema: {
        before: this.beforeCreatePrismaSchema,
      },
    };
  }

  beforeCreateServer(context: DsgContext, eventParams: CreateServerParams) {
    const generateErrorMessage = (
      entityName: string,
      fieldName: string
    ) => `MultiSelectOptionSet (list of primitives type) on entity: ${entityName}, field: ${fieldName}, is not supported by MySQL prisma provider. 
    You can select another data type or change your DB to PostgreSQL`;

    context.entities?.forEach(({ name: entityName, fields }) => {
      const field = fields.find(
        ({ dataType }) => dataType === EnumDataType.MultiSelectOptionSet
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
    eventParams: CreateServerDotEnvParams
  ) {
    const { settings } = currentInstallation(context.pluginInstallations) || {
      settings: {},
    };

    const fullSettings = merge(defaultSettings, settings);

    const { port, password, user, host, dbName } = fullSettings;

    eventParams.envVariables = [
      ...eventParams.envVariables,
      ...[
        { DB_USER: user },
        { DB_PASSWORD: password },
        { DB_PORT: port },
        {
          DB_URL: `mysql://${user}:${password}@${host}:${port}/${dbName}`,
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

  beforeCreateServerDockerComposeDB(
    context: DsgContext,
    eventParams: CreateServerDockerComposeDBParams
  ) {
    context.utils.skipDefaultBehavior = true;
    return eventParams;
  }

  async afterCreateServerDockerComposeDB(context: DsgContext) {
    const staticPath = resolve(__dirname, "./static");
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.baseDirectory
    );

    return staticsFiles;
  }

  beforeCreatePrismaSchema(
    context: DsgContext,
    eventParams: CreatePrismaSchemaParams
  ) {
    return {
      ...eventParams,
      dataSource: dataSource,
    };
  }
}

export default MySQLPlugin;

function currentInstallation(
  pluginInstallations: PluginInstallation[]
): PluginInstallation | undefined {
  const plugin = pluginInstallations.find((plugin, i) => {
    return plugin.npm === name;
  });

  return plugin;
}
