import {
  CreateServerDockerComposeDBParams,
  CreateServerDockerComposeParams,
  PrismaDataSource,
  VariableDictionary,
} from "@amplication/code-gen-types";

export const envVariables: VariableDictionary = [
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

export const updateDockerComposeDBProperties: CreateServerDockerComposeDBParams["before"]["updateProperties"] =
  [
    { path: "services.db.image", value: "postgres:12" },
    { path: "services.db.ports", value: ["${POSTGRESQL_PORT}:5432"] },
    {
      path: "services.db.environment",
      value: {
        POSTGRES_USER: "${POSTGRESQL_USER}",
        POSTGRES_PASSWORD: "${POSTGRESQL_PASSWORD}",
      },
    },
    {
      path: "services.db.volumes",
      value: ["postgres:/var/lib/postgresql/data"],
    },
    { path: "volumes", value: { postgres: null } },
  ];

export const updateDockerComposeProperties: CreateServerDockerComposeParams["before"]["updateProperties"] =
  [
    { path: "services.server.ports", value: ["${SERVER_PORT}:3000"] },
    {
      path: "services.server.environment",
      value: {
        POSTGRESQL_URL:
          "postgres://${POSTGRESQL_USER}:${POSTGRESQL_PASSWORD}@db:5433",
        BCRYPT_SALT: "${BCRYPT_SALT}",
        JWT_SECRET_KEY: "${JWT_SECRET_KEY}",
        JWT_EXPIRATION: "${JWT_EXPIRATION}",
      },
    },
    {
      path: "services.migrate.environment",
      value: {
        POSTGRESQL_URL:
          "postgres://${POSTGRESQL_USER}:${POSTGRESQL_PASSWORD}@db:5432",
        BCRYPT_SALT: "${BCRYPT_SALT}",
      },
    },
    { path: "services.db.image", value: "postgres:12" },
    { path: "services.db.ports", value: ["${POSTGRESQL_PORT}:5432"] },
    {
      path: "services.db.environment",
      value: {
        POSTGRES_USER: "${POSTGRESQL_USER}",
        POSTGRES_PASSWORD: "${POSTGRESQL_PASSWORD}",
      },
    },
    {
      path: "services.db.volumes",
      value: ["postgres:/var/lib/postgresql/data"],
    },
    {
      path: "volumes",
      value: { postgres: null },
    },
  ];

export const dataSource: PrismaDataSource = {
  name: "postgres",
  provider: "PostgreSQL",
  urlEnv: "POSTGRESQL_URL",
};
