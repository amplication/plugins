import {
  VariableDictionary,
  CreateServerDockerComposeParams,
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
    DB_URL: "mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}${dbName}",
  },
];

export const updateDockerComposeProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        server: {
          environment: {
            DB_URL: "mysql://${DB_USER}:${DB_PASSWORD}@db:3306",
          },
        },
        migrate: {
          environment: {
            DB_URL: "mysql://${DB_USER}:${DB_PASSWORD}@db:3306",
          },
        },
        adminer: {
          image: "adminer",
          restart: "always",
          ports: ["1234:8080"],
        },
        db: {
          image: "mysql",
          command: "--default-authentication-plugin=mysql_native_password",
          restart: "always",
          ports: ["${DB_PORT}:3306"],
          environment: {
            DB_ROOT_PASSWORD: "${DB_PASSWORD}",
          },
          healthcheck: {
            test: [
              "CMD",
              "mysqladmin",
              "ping",
              "-h",
              "localhost",
              "-u",
              "${DB_USER}",
            ],
            timeout: "45s",
            interval: "10s",
            retries: 10,
          },
        },
      },
      volumes: {
        mysql: null,
      },
    },
  ];

export const dataSource: DataSource = {
  name: "mysql",
  provider: DataSourceProvider.MySQL,
  url: new DataSourceURLEnv("DB_URL"),
};
