import { resolve } from "path";
import {
  dataSource,
  envVariables,
  updateDockerComposeProperties,
} from "./constants";
import {
  DsgContext,
  AmplicationPlugin,
  CreateServerDockerComposeDBParams,
  CreateServerDockerComposeParams,
  CreateServerDotEnvParams,
  CreatePrismaSchemaParams,
  Events,
} from "@amplication/code-gen-types";

class PostgresPlugin implements AmplicationPlugin {
  static baseDir = "";

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
    eventParams: CreateServerDotEnvParams["before"]
  ) {
    eventParams.envVariables = [...eventParams.envVariables, ...envVariables];

    return eventParams;
  }

  beforeCreateServerDockerCompose(
    context: DsgContext,
    eventParams: CreateServerDockerComposeParams["before"]
  ) {
    return {
      ...eventParams,
      updateProperties: updateDockerComposeProperties,
    };
  }

  beforeCreateServerDockerComposeDB(
    context: DsgContext,
    eventParams: CreateServerDockerComposeDBParams["before"]
  ) {
    context.utils.skipDefaultBehavior = true;
    return eventParams;
  }

  async afterCreateServerDockerComposeDB(context: DsgContext) {
    PostgresPlugin.baseDir = context.serverDirectories.baseDirectory;
    const staticPath = resolve(__dirname, "../static");
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      PostgresPlugin.baseDir
    );

    return staticsFiles;
  }

  beforeCreatePrismaSchema(
    context: DsgContext,
    eventParams: CreatePrismaSchemaParams["before"]
  ) {
    return {
      ...eventParams,
      dataSource: dataSource,
    };
  }
}

export default PostgresPlugin;
