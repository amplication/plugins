import { DsgContext, AmplicationPlugin } from "@amplication/code-gen-types";
import { Events } from "@amplication/code-gen-types/dist/plugin-events";
import {
  CreateServerDockerComposeDBParams,
  CreateServerDockerComposeParams,
  CreateServerDotEnvParams,
} from "@amplication/code-gen-types/dist/plugin-events-params";

class JwtAuthPlugin implements AmplicationPlugin {
  static srcDir = "";

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
      },
    };
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams["before"]
  ) {
    eventParams.envVariables = [
      { POSTGRESQL_USER: "${dbUser}" },
      { POSTGRESQL_PASSWORD: "${dbPassword}" },
      { POSTGRESQL_PORT: "${dbPort}" },
      {
        POSTGRESQL_URL:
          "postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}${dbName}",
      },
    ];

    return eventParams;
  }

  beforeCreateServerDockerCompose(
    context: DsgContext,
    eventParams: CreateServerDockerComposeParams["before"]
  ) {
    return eventParams;
  }

  beforeCreateServerDockerComposeDB(
    context: DsgContext,
    eventParams: CreateServerDockerComposeDBParams["before"]
  ) {
    return eventParams;
  }
}

export default JwtAuthPlugin;
