import {
  CreateServerDockerComposeParams,
  PrismaDataSource,
  VariableDictionary,
} from "@amplication/code-gen-types";

export const envVariables: VariableDictionary = [
  { POSTGRESQL_USER: "${dbUser}" },
  { POSTGRESQL_PASSWORD: "${dbPassword}" },
  { POSTGRESQL_PORT: "${dbPort}" },
  {
    POSTGRESQL_URL:
      "postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}${dbName}",
  },
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
    {
      path: "services.db",
      value: {
        image: "postgres:12",
        ports: ["${POSTGRESQL_PORT}:5432"],
        environment: {
          POSTGRES_USER: "${POSTGRESQL_USER}",
          POSTGRES_PASSWORD: "${POSTGRESQL_PASSWORD}",
        },
        volumes: ["postgres:/var/lib/postgresql/data"],
        healthcheck: {
          test: [
            "CMD",
            "pg_isready",
            "-q",
            "-d",
            "${POSTGRESQL_DB_NAME}",
            "-U",
            "${POSTGRESQL_USER}",
          ],
        },
      },
    },
    {
      path: "volumes.postgres",
      value: null,
    },
  ];

export const dataSource: PrismaDataSource = {
  name: "postgres",
  provider: "PostgreSQL",
  urlEnv: "POSTGRESQL_URL",
};
