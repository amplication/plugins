import {
  VariableDictionary,
  CreateServerDockerComposeParams,
  PrismaDataSource,
} from "@amplication/code-gen-types";

export const envVariables: VariableDictionary = [
  { DB_USER: "${dbUser}" },
  { DB_ROOT_PASSWORD: "${dbPassword}" },
  { DB_PORT: "${dbPort}" },
  {
    DB_URL: "mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}${dbName}",
  },
];

export const updateDockerComposeProperties: CreateServerDockerComposeParams["before"]["updateProperties"] =
  [
    { path: "services.server.ports", value: ["${SERVER_PORT}:3000"] },
    {
      path: "services.server.environment",
      value: {
        DB_URL: "mysql://${DB_USER}:${DB_ROOT_PASSWORD}@db:3306",
        BCRYPT_SALT: "${BCRYPT_SALT}",
        JWT_SECRET_KEY: "${JWT_SECRET_KEY}",
        JWT_EXPIRATION: "${JWT_EXPIRATION}",
      },
    },
    {
      path: "services.migrate.environment",
      value: {
        DB_URL: "mysql://${DB_USER}:${DB_ROOT_PASSWORD}@db:3306",
        BCRYPT_SALT: "${BCRYPT_SALT}",
      },
    },
    {
      path: "services.adminer",
      value: { image: "adminer", restart: "always", ports: ["1234:8080"] },
    },
    {
      path: "services.db",
      value: {
        image: "mysql",
        command: "--default-authentication-plugin=mysql_native_password",
        restart: "always",
        ports: ["${DB_PORT}:3306"],
        environment: {
          DB_ROOT_PASSWORD: "${DB_ROOT_PASSWORD}",
        },
        volumes: ["mysql:/var/lib/mysql/data"],
        healthcheck: {
          test: [
            "CMD",
            "pg_isready",
            "-q",
            "-d",
            "${DB_DB_NAME}",
            "-U",
            "${DB_USER}",
          ],
        },
      },
    },
    {
      path: "volumes.mysql",
      value: null,
    },
  ];

export const dataSource: PrismaDataSource = {
  name: "mysql",
  provider: "MySQL",
  urlEnv: "DB_URL",
};
