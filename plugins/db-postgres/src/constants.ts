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
    DB_URL: "postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}${dbName}",
  },
];

export const updateDockerComposeProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        server: {
          environment: {
            DB_URL: "postgres://${DB_USER}:${DB_PASSWORD}@db:5433",
          },
        },
        migrate: {
          environment: {
            DB_URL: "postgres://${DB_USER}:${DB_PASSWORD}@db:5432",
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
              "${DB_DB_NAME}",
              "-U",
              "${DB_USER}",
            ],
          },
        },
      },
      volumes: {
        postgres: null,
      },
    },
  ];

export const dataSource: PrismaDataSource = {
  name: "postgres",
  provider: "PostgreSQL",
  urlEnv: "DB_URL",
};
