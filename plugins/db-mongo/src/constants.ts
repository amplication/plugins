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
  { DB_PORT: "27017" },
  {
    DB_URL: "mongodb://${dbUser}:${dbPassword}@${dbHost}:27017/dbName?authSource=admin",
  },
];

export const updateDockerComposeProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        server: {
          environment: {
            DB_URL: "mongodb://${DB_USER}:${DB_PASSWORD}@db:27017",
          },
        },
        db: {
          image: "mongo",
          ports: ["${DB_PORT}:27017"],
          environment: {
            MONGO_USER: "${DB_USER}",
            MONGO_PASSWORD: "${DB_PASSWORD}",
          },
          volumes: ["mongodb:/var/lib/mongosql/data"],
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
            timeout: "45s",
            interval: "10s",
            retries: 10,
          },
        },
      },
      volumes: {
        mongo: null,
      },
    },
  ];

export const dataSource: DataSource = {
  name: "mongo",
  provider: DataSourceProvider.MongoDB,
  url: new DataSourceURLEnv("DB_URL"),

};
