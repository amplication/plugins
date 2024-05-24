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
            ConnectionStrings__DbContext: `Host=db:5432;Username=${user};Password=${password};Database=${dbName}`,
          },
        },
        migrate: {
          environment: {
            MIGRATION_CONNECTION: `Host=db:5432;Username=${user};Password=${password};Database=${dbName}`,
          },
        },
        db: {
          image: "postgres:15",
          restart: "unless-stopped",
          ports: [`${port}:5432`],
          environment: {
            POSTGRES_DB: dbName,
            POSTGRES_USER: user,
            POSTGRES_PASSWORD: password,
          },
          healthcheck: {
            test: [
              "CMD-SHELL",
              "pg_isready -d $${POSTGRES_DB} -U $${POSTGRES_USER}",
            ],
            timeout: "5s",
            interval: "10s",
            retries: 10,
            start_period: "10s",
          },
        },
      },
      volumes: {
        postgres: null,
      },
    },
  ];
};
