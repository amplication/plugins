import { CreateServerDockerComposeParams } from "@amplication/code-gen-types";
import { DataSource, DataSourceProvider } from "prisma-schema-dsl-types";

export const updateDockerComposeProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        server: {
          environment: {
            DB_URL: "mysql://${DB_USER}:${DB_PASSWORD}@db:3306/${DB_NAME}",
          },
        },
        migrate: {
          environment: {
            DB_URL: "mysql://${DB_USER}:${DB_PASSWORD}@db:3306/${DB_NAME}",
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
            MYSQL_ROOT_PASSWORD: "${DB_PASSWORD}",
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
  name: "db",
  provider: DataSourceProvider.MySQL,
  url: {
    name: "DB_URL",
  },
};
