import { CreateServerDockerComposeParams } from "@amplication/code-gen-types";
import { Settings } from "./types";

export const updateDockerComposeProperties = (
  settings: Settings
): CreateServerDockerComposeParams["updateProperties"] => {
  const { port, password, user, dbName } = settings;

  return [
    {
      services: {
        server: {
          environment: {
            ConnectionStrings__DbContext: `sqlserver://db:${port};database=${dbName};user=${user};password=${password};TrustServerCertificate=true`,
          },
          depends_on: {
            migrate: {
              condition: "service_completed_successfully",
            },
          },
        },
        migrate: {
          environment: {
            MIGRATION_CONNECTION: `sqlserver://db:${port};database=${dbName};user=${user};password=${password};TrustServerCertificate=true`,
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
        mssql: null, //mssql: "/var/opt/mssql",
      },
    },
  ];
};
