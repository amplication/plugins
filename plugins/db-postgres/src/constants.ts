import {
  CreateServerDockerComposeParams,
  PrismaDataSource,
  VariableDictionary,
} from "@amplication/code-gen-types";

export const envVariables: VariableDictionary = [
  { DB_USER: "${dbUser}" },
  { DB_PASSWORD: "${dbPassword}" },
  { DB_PORT: "${dbPort}" },
  {
    DB_URL:
      "postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}${dbName}",
  },
];

export const updateDockerComposeProperties: CreateServerDockerComposeParams["before"]["updateProperties"] =
  [
    { path: "services.server.ports", value: ["${SERVER_PORT}:3000"] },
    {
      path: "services.server.environment",
      value: {
        DB_URL:
          "postgres://${DB_USER}:${DB_PASSWORD}@db:5433",
        BCRYPT_SALT: "${BCRYPT_SALT}",
        JWT_SECRET_KEY: "${JWT_SECRET_KEY}",
        JWT_EXPIRATION: "${JWT_EXPIRATION}",
      },
    },
    {
      path: "services.migrate.environment",
      value: {
        DB_URL:
          "postgres://${DB_USER}:${DB_PASSWORD}@db:5432",
        BCRYPT_SALT: "${BCRYPT_SALT}",
      },
    },
    {
      path: "services.db",
      value: {
        image: "postgres:12",
        ports: ["${DB_PORT}:5432"],
        environment: {
          POSTGRES_USER: "${DB_USER}",
          POSTGRES_PASSWORD: "${DB_PASSWORD}",
        },
        volumes: ["postgres:/var/lib/postgresql/data"],
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
      path: "volumes.postgres",
      value: null,
    },
  ];

export const dataSource: PrismaDataSource = {
  name: "postgres",
  provider: "PostgreSQL",
  urlEnv: "DB_URL",
};
