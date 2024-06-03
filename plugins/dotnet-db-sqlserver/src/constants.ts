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
            ConnectionStrings__DbContext: `Data Source=db,1433;Initial Catalog=${dbName};User Id=${user};Password=${password};TrustServerCertificate=true;`,
          },
          depends_on: {
            migrate: {
              condition: "service_completed_successfully",
            },
          },
        },
        migrate: {
          environment: {
            MIGRATION_CONNECTION: `Data Source=db,1433;Initial Catalog=${dbName};User Id=${user};Password=${password};TrustServerCertificate=true;`,
          },
        },
        db: {
          image: "mcr.microsoft.com/mssql/server:2022-latest",
          restart: "unless-stopped",
          ports: [`${port}:1433`],
          environment: {
            MSSQL_SA_PASSWORD: password,
            ACCEPT_EULA: "Y",
          },
          healthcheck: {
            test: [
              "CMD",
              "/opt/mssql-tools/bin/sqlcmd",
              "-S",
              "localhost",
              "-U",
              user,
              "-P",
              password,
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
