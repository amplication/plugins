import { CreateServerDockerComposeParams } from "@amplication/code-gen-types";
import { DataSource, DataSourceProvider } from "prisma-schema-dsl-types";

export const updateDockerComposeProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        server: {
          environment: {
            DB_URL: "`sqlserver://db:1143;database=${DB_NAME};user=${DB_USER};password=${DB_PASSWORD}`",
          },
        },
        migrate: {
          environment: {
            DB_URL: "`sqlserver://db:1143;database=${DB_NAME};user=${DB_USER};password=${DB_PASSWORD}`",
          },
        },
        db: {
          image: "mcr.microsoft.com/mssql/server:2022-latest",
          restart: "unless-stopped",
          ports: ["${DB_PORT}:1433"],
          environment: {
            MSSQL_SA_PASSWORD: "${DB_PASSWORD}",
            ACCEPT_EULA: "Y",
          },
          healthcheck: {
            test: [
              "CMD",
              "/opt/mssql-tools/bin/sqlcmd",
              "-S",
              "localhost",
              "-U",
              "${DB_USER}",
              "-P",
              "${DB_PASSWORD}",
              "-Q",
              "SELECT 1",
              "-b",
              "-o",
              "/dev/null",              
            ],
            timeout: "5s",
            interval: "10s",
            retries: 10,
            start_period: "10s",
          },
        },
      },
      volumes: {
        mssql: null,  //mssql: "/var/opt/mssql",
      },
    },
  ];

export const updateDockerComposeDevProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        db: {
          image: "mcr.microsoft.com/mssql/server:2022-latest",
          restart: "unless-stopped",
          ports: ["${DB_PORT}:1433"],
          environment: {
            MSSQL_SA_PASSWORD: "${DB_PASSWORD}",
            ACCEPT_EULA: "Y",
          },
          healthcheck: {
            test: [
              "CMD",
              "/opt/mssql-tools/bin/sqlcmd",
              "-S",
              "localhost",
              "-U",
              "${DB_USER}",
              "-P",
              "${DB_PASSWORD}",
              "-Q",
              "SELECT 1",
              "-b",
              "-o",
              "/dev/null",              
            ],
            timeout: "5s",
            interval: "10s",
            retries: 10,
            start_period: "10s",
          },
        },
      },
      volumes: {
        mssql: null,
      },
    },
  ];

const DATASOURCE_NAME = "db";
const URL_NAME = "DB_URL";

export const dataSource: DataSource = {
  name: DATASOURCE_NAME,
  provider: DataSourceProvider.MSSQLServer,
  url: {
    name: URL_NAME,
  },
};
