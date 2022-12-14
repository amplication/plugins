import {
  CreateServerDockerComposeParams,
  VariableDictionary,
} from "@amplication/code-gen-types";
import {
  DataSource,
  DataSourceProvider,
  DataSourceURLEnv,
} from "prisma-schema-dsl-types";

export const envVariables: VariableDictionary = [
  { DB_USER: "${dbUser}" },
  { DB_PASSWORD: "${dbPassword}" },
  { DB_PORT: "${dbPort}" },
  {
    DB_URL: "postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}${dbName}",
  },
];

export const updateDockerComposeProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        server: {
          environment: {
            DB_URL: "postgres://${DB_USER}:${DB_PASSWORD}@db:${DB_PORT}",
          },
        },
        migrate: {
          environment: {
            DB_URL: "postgres://${DB_USER}:${DB_PASSWORD}@db:${DB_PORT}",
          },
        },
        db: {
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
              "${DB_NAME}",
              "-U",
              "${DB_USER}",
            ],
            timeout: "45s",
            interval: "10s",
            retries: 10,
          },
        },
      },
      volumes: {
        postgres: null,
      },
    },
  ];

export const dataSource: DataSource = {
  name: "postgres",
  provider: DataSourceProvider.PostgreSQL,
  url: new DataSourceURLEnv("DB_URL"),
};
