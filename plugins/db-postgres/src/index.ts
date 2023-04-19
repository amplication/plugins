import {
  AmplicationPlugin,
  CreatePrismaSchemaParams,
  CreateServerDockerComposeDBParams,
  CreateServerDockerComposeParams,
  CreateServerDotEnvParams,
  DsgContext,
  Events,
  PluginInstallation,
} from "@amplication/code-gen-types";
import { merge } from "lodash";
import { resolve } from "path";
import defaultSettings from "../.amplicationrc.json";
import { name } from "../package.json";
import { dataSource, updateDockerComposeProperties } from "./constants";

class PostgresPlugin implements AmplicationPlugin {
  register(): Events {
    return {
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
        {
          DB_URL: `postgres://${user}:${password}@${host}:${port}/${dbName}`,
        },
        { DB_USER: user },
        { DB_PASSWORD: password },
        { DB_PORT: port },
        { DB_NAME: dbName },
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

export default PostgresPlugin;

function currentInstallation(
  pluginInstallations: PluginInstallation[]
): PluginInstallation | undefined {
  const plugin = pluginInstallations.find((plugin, i) => {
    return plugin.npm === name;
  });

  return plugin;
}
