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
import { resolve } from "path";
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
    const { settings } = currentInstallation(context.pluginInstallations);
    const { port, password, user, host, dbName } = settings;

    eventParams.envVariables = [
      ...eventParams.envVariables,
      ...[
        {
          DB_URL: `postgres://${user}:${password}@${host}:${port}/${dbName}`,
        },
        { DB_USER: user },
        { DB_PASSWORD: password },
        { DB_PORT: port },
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
): PluginInstallation {
  const plugin = pluginInstallations.find((plugin, i) => {
    return plugin.npm === name;
  });
  if (!plugin) {
    throw new Error("Missing plugin installation");
  }

  return plugin;
}
