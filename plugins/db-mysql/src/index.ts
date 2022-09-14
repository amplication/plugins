import { DsgContext, AmplicationPlugin } from "@amplication/code-gen-types";
import { Events } from "@amplication/code-gen-types/dist/plugin-events";
import {
  CreateServerDockerComposeDBParams,
  CreateServerDockerComposeParams,
  CreateServerDotEnvParams,
  VariableDictionary,
} from "@amplication/code-gen-types/dist/plugin-events-params";

class JwtAuthPlugin implements AmplicationPlugin {
  envVariables: VariableDictionary = [
    { MYSQL_USER: "${dbUser}" },
    { MYSQL_ROOT_PASSWORD: "${dbPassword}" },
    { MYSQL_DB_NAME: "${dbName}" },
    { MYSQL_PORT: "${dbPort}" },
    { MYSQL_HOST: "${dbHost}" },
    {
      MYSQL_URL: "mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}${dbName}",
    },
  ];

  updateDockerComposeDBProperties = {
    services: {
      db: {
        image: "mysql",
        command: "--default-authentication-plugin=mysql_native_password",
        restart: "always",
        ports: ["${MYSQL_PORT}:3306"],
        environment: {
          MYSQL_USER: "${MYSQL_USER}",
          MYSQL_ROOT_PASSWORD: "${MYSQL_ROOT_PASSWORD}",
        },
        volumes: ["mysql:/var/lib/mysql/data"],
      },
      adminer: {
        image: "adminer",
        restart: "always",
        ports: ["1234:8080"],
      },
    },
    volumes: {
      mysql: null,
    },
  };

  updateDockerComposeProperties = {
    services: {
      server: {
        ports: ["${SERVER_PORT}:3000"],
        environment: {
          MYSQL_URL: "mysql://${MYSQL_USER}:${MYSQL_ROOT_PASSWORD}@db:3306",
          BCRYPT_SALT: "${BCRYPT_SALT}",
          JWT_SECRET_KEY: "${JWT_SECRET_KEY}",
          JWT_EXPIRATION: "${JWT_EXPIRATION}",
        },
      },
      migrate: {
        environment: {
          MYSQL_URL: "mysql://${MYSQL_USER}:${MYSQL_ROOT_PASSWORD}@db:3306",
        },
      },
      db: this.updateDockerComposeDBProperties.services.db,
    },
    volumes: {
      mysql: null,
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

export default JwtAuthPlugin;
