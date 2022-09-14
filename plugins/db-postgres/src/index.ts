import { DsgContext, AmplicationPlugin } from "@amplication/code-gen-types";
import { Events } from "@amplication/code-gen-types/dist/plugin-events";
import {
  CreateServerDockerComposeDBParams,
  CreateServerDockerComposeParams,
  CreateServerDotEnvParams,
  VariableDictionary,
} from "@amplication/code-gen-types/dist/plugin-events-params";

class PostgresPlugin implements AmplicationPlugin {
  envVariables: VariableDictionary = [
    { POSTGRESQL_USER: "${dbUser}" },
    { POSTGRESQL_PASSWORD: "${dbPassword}" },
    { POSTGRESQL_DB_NAME: "${dbName}" },
    { POSTGRESQL_PORT: "${dbPort}" },
    { POSTGRESQL_HOST: "${dbHost}" },
    {
      POSTGRESQL_URL:
        "postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}${dbName}",
    },
  ];

  updateDockerComposeDBProperties = {
    services: {
      db: {
        image: "postgres:12",
        ports: ["${POSTGRESQL_PORT}:5432"],
        environment: {
          POSTGRES_USER: "${POSTGRESQL_USER}",
          POSTGRES_PASSWORD: "${POSTGRESQL_PASSWORD}",
        },
        volumes: ["postgres:/var/lib/postgresql/data"],
      },
    },
    volumes: {
      postgres: null,
    },
  };

  updateDockerComposeProperties = {
    services: {
      server: {
        ports: ["${SERVER_PORT}:3000"],
        environment: {
          POSTGRESQL_URL:
            "postgres://${POSTGRESQL_USER}:${POSTGRESQL_PASSWORD}@db:5433",
          BCRYPT_SALT: "${BCRYPT_SALT}",
          JWT_SECRET_KEY: "${JWT_SECRET_KEY}",
          JWT_EXPIRATION: "${JWT_EXPIRATION}",
        },
      },
      migrate: {
        environment: {
          POSTGRESQL_URL:
            "postgres://${POSTGRESQL_USER}:${POSTGRESQL_PASSWORD}@db:5432",
        },
      },
      db: this.updateDockerComposeDBProperties.services.db,
    },
    volumes: {
      postgres: null,
    },
  };

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
    eventParams.envVariables = this.envVariables;

    return eventParams;
  }

  beforeCreateServerDockerCompose(
    context: DsgContext,
    eventParams: CreateServerDockerComposeParams["before"]
  ) {
    eventParams.updateProperties = this.updateDockerComposeProperties;
    return eventParams;
  }

  beforeCreateServerDockerComposeDB(
    context: DsgContext,
    eventParams: CreateServerDockerComposeDBParams["before"]
  ) {
    eventParams.updateProperties = this.updateDockerComposeDBProperties;
    return eventParams;
  }
}

export default PostgresPlugin;
