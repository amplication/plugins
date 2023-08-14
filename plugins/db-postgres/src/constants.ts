import { CreateServerDockerComposeParams } from "@amplication/code-gen-types";
import { DataSource, DataSourceProvider } from "prisma-schema-dsl-types";

export const updateDockerComposeProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        server: {
          environment: {
            DB_URL: "postgres://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}",
          },
        },
        migrate: {
          environment: {
            DB_URL: "postgres://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}",
          },
        },
        db: {
          image: "postgres:12",
          ports: ["${DB_PORT}:5432"],
          environment: {
            POSTGRES_USER: "${DB_USER}",
            POSTGRES_PASSWORD: "${DB_PASSWORD}",
            POSTGRES_DB: "${DB_NAME}",
          },
          volumes: ["postgres:/var/lib/postgresql/data"],
          healthcheck: {
            test: [
              "CMD-SHELL",
              "pg_isready -d $${POSTGRES_DB} -U $${POSTGRES_USER}",
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

const DATASOURCE_NAME = "db";
const URL_NAME = "DB_URL";

export const dataSource: DataSource = {
  name: DATASOURCE_NAME,
  provider: DataSourceProvider.PostgreSQL,
  url: {
    name: URL_NAME,
  },
};
