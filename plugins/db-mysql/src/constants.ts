import {
  VariableDictionary,
  CreateServerDockerComposeDBParams,
  CreateServerDockerComposeParams,
  PrismaDataSource,
} from "@amplication/code-gen-types";

export const envVariables: VariableDictionary = [
  { MYSQL_USER: "${dbUser}" },
  { MYSQL_ROOT_PASSWORD: "${dbPassword}" },
  { MYSQL_DB_NAME: "${dbName}" },
  { MYSQL_PORT: "${dbPort}" },
  { MYSQL_HOST: "${dbHost}" },
  {
    MYSQL_URL: "mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}${dbName}",
  },
];

export const updateDockerComposeDBProperties: CreateServerDockerComposeDBParams["before"]["updateProperties"] =
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

export const updateDockerComposeProperties: CreateServerDockerComposeParams["before"]["updateProperties"] =
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

export const dataSource: PrismaDataSource = {
  name: "mysql",
  provider: "MySQL",
  urlEnv: "MySQL_URL",
};
