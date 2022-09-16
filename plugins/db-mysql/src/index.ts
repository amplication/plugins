import { resolve } from "path";
import {
  DsgContext,
  AmplicationPlugin,
  PrismaDataSource,
  CreateServerDockerComposeDBParams,
  CreateServerDockerComposeParams,
  CreateServerDotEnvParams,
  CreatePrismaSchemaParams,
  VariableDictionary,
} from "@amplication/code-gen-types";
import { Events } from "@amplication/code-gen-types";

class MySQLPlugin implements AmplicationPlugin {
  static baseDir = "";
  static envVariables: VariableDictionary = [
    { MYSQL_USER: "${dbUser}" },
    { MYSQL_ROOT_PASSWORD: "${dbPassword}" },
    { MYSQL_DB_NAME: "${dbName}" },
    { MYSQL_PORT: "${dbPort}" },
    { MYSQL_HOST: "${dbHost}" },
    {
      MYSQL_URL: "mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}${dbName}",
    },
  ];

  static updateDockerComposeDBProperties: CreateServerDockerComposeDBParams["before"]["updateProperties"] =
    [
      { path: "services.db.image", value: "mysql" },
      {
        path: "services.db.command",
        value: "--default-authentication-plugin=mysql_native_password",
      },
      { path: "services.db.restart", value: "always" },
      { path: "services.db.ports", value: ["${MYSQL_PORT}:3306"] },
      { path: "services.db.volumes", value: ["mysql:/var/lib/mysql/data"] },
      {
        path: "services.db.environment.MYSQL_USER",
        value: "${MYSQL_USER}",
      },
      {
        path: "services.db.environment.MYSQL_ROOT_PASSWORD",
        value: "${MYSQL_ROOT_PASSWORD}",
      },
      {
        path: "services.adminer",
        value: { image: "adminer", restart: "always", ports: ["1234:8080"] },
      },
      {
        path: "volumes",
        value: { mysql: null },
      },
    ];

  static updateDockerComposeProperties: CreateServerDockerComposeParams["before"]["updateProperties"] =
    [
      { path: "services.server.ports", value: ["${SERVER_PORT}:3000"] },
      {
        path: "services.server.environment",
        value: {
          MYSQL_URL: "mysql://${MYSQL_USER}:${MYSQL_ROOT_PASSWORD}@db:3306",
          BCRYPT_SALT: "${BCRYPT_SALT}",
          JWT_SECRET_KEY: "${JWT_SECRET_KEY}",
          JWT_EXPIRATION: "${JWT_EXPIRATION}",
        },
      },
      {
        path: "services.migrate.environment",
        value: {
          MYSQL_URL: "mysql://${MYSQL_USER}:${MYSQL_ROOT_PASSWORD}@db:3306",
          BCRYPT_SALT: "${BCRYPT_SALT}",
        },
      },
      {
        path: "services.adminer",
        value: { image: "adminer", restart: "always", ports: ["1234:8080"] },
      },
      { path: "services.db.image", value: "mysql" },
      {
        path: "services.db.command",
        value: "--default-authentication-plugin=mysql_native_password",
      },
      { path: "services.db.restart", value: "always" },
      { path: "services.db.ports", value: ["${MYSQL_PORT}:3306"] },
      { path: "services.db.volumes", value: ["mysql:/var/lib/mysql/data"] },
      {
        path: "services.db.environment",
        value: {
          MYSQL_USER: "${MYSQL_USER}",
          MYSQL_ROOT_PASSWORD: "${MYSQL_ROOT_PASSWORD}",
        },
      },
      {
        path: "services.db.healthcheck.test",
        value: [
          "CMD",
          "pg_isready",
          "-q",
          "-d",
          "${MYSQL_DB_NAME}",
          "-U",
          "${MYSQL_USER}",
        ],
      },
      {
        path: "services.db.healthcheck.test",
        value: [
          "CMD",
          "pg_isready",
          "-q",
          "-d",
          "${MYSQL_DB_NAME}",
          "-U",
          "${MYSQL_USER}",
        ],
      },
      {
        path: "volumes",
        value: { mysql: null },
      },
    ];

  static dataSource: PrismaDataSource = {
    name: "mysql",
    provider: "MySQL",
    urlEnv: "MySQL_URL",
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
    eventParams.envVariables = [
      ...eventParams.envVariables,
      ...MySQLPlugin.envVariables,
    ];

    return eventParams;
  }

  beforeCreateServerDockerCompose(
    context: DsgContext,
    eventParams: CreateServerDockerComposeParams["before"]
  ) {
    return {
      ...eventParams,
      updateProperties: MySQLPlugin.updateDockerComposeProperties,
    };
  }

  beforeCreateServerDockerComposeDB(
    context: DsgContext,
    eventParams: CreateServerDockerComposeDBParams["before"]
  ) {
    context.utils.skipDefaultBehavior = true;
    return eventParams;
  }

  async afterCreateServerDockerComposeDB(
    context: DsgContext,
    modules: CreateServerDockerComposeDBParams["after"]
  ) {
    MySQLPlugin.baseDir = context.serverDirectories.baseDirectory;
    const staticPath = resolve(__dirname, "../static");
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      MySQLPlugin.baseDir
    );

    return staticsFiles;
  }

  beforeCreatePrismaSchema(
    context: DsgContext,
    eventParams: CreatePrismaSchemaParams["before"]
  ) {
    return {
      ...eventParams,
      dataSource: MySQLPlugin.dataSource,
    };
  }
}

export default MySQLPlugin;
