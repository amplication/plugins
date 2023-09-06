import { CreateServerDockerComposeParams } from "@amplication/code-gen-types";
import { DataSource, DataSourceProvider } from "prisma-schema-dsl-types";

const mongodbVolumeName = "mongo";

export const updateDockerComposeProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        server: {
          environment: {
            DB_URL:
              "mongodb://${DB_USER}:${DB_PASSWORD}@db:27017/${DB_NAME}?authSource=admin",
          },
          depends_on: ["migrate"],
        },
        migrate: {
          environment: {
            DB_URL:
              "mongodb://${DB_USER}:${DB_PASSWORD}@db:27017/${DB_NAME}?authSource=admin",
          },
          depends_on: {
            db: {
              condition: "service_healthy",
            },
          },
        },
        db: {
          image: "mongo",
          ports: ["${DB_PORT}:27017"],
          environment: {
            MONGO_INITDB_ROOT_USERNAME: "${DB_USER}",
            MONGO_INITDB_ROOT_PASSWORD: "${DB_PASSWORD}",
            MONGO_INITDB_DATABASE: "${DB_NAME}",
            MONGO_REPLICA_SET_NAME: "rs0",
          },
          restart: "always",
          entrypoint: [
            "/bin/bash",
            "-c",
            "openssl rand -base64 741 > /data/cert.crt; chmod 400 /data/cert.crt && chown 999 /data/cert.crt; /usr/local/bin/docker-entrypoint.sh mongod --bind_ip_all --keyFile /data/cert.crt --replSet rs0",
          ],
          healthcheck: {
            test: 'test $$(mongosh --quiet -u  $${MONGO_INITDB_ROOT_USERNAME} -p $${MONGO_INITDB_ROOT_PASSWORD} --eval "try { rs.initiate({ _id: \'"rs0"\',members: [{ _id: 0, host: \'"localhost"\' }] }).ok } catch (_) { rs.status().ok}") -eq 1',
            start_period: "5s",
            interval: "10s",
            timeout: "10s",
          },
          volumes: [`${mongodbVolumeName}:/var/lib/mongosql/data`],
        },
      },
      volumes: {
        [mongodbVolumeName]: null,
      },
    },
  ];

export const updateDockerComposeDevProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        db: {
          image: "mongo",
          ports: ["${DB_PORT}:27017"],
          environment: {
            MONGO_INITDB_ROOT_USERNAME: "${DB_USER}",
            MONGO_INITDB_ROOT_PASSWORD: "${DB_PASSWORD}",
            MONGO_INITDB_DATABASE: "${DB_NAME}",
            MONGO_REPLICA_SET_NAME: "rs0",
          },
          restart: "always",
          entrypoint: [
            "/bin/bash",
            "-c",
            "openssl rand -base64 741 > /data/cert.crt; chmod 400 /data/cert.crt && chown 999 /data/cert.crt; /usr/local/bin/docker-entrypoint.sh mongod --bind_ip_all --keyFile /data/cert.crt --replSet rs0",
          ],
          healthcheck: {
            test: 'test $$(mongosh --quiet -u  $${MONGO_INITDB_ROOT_USERNAME} -p $${MONGO_INITDB_ROOT_PASSWORD} --eval "try { rs.initiate({ _id: \'"rs0"\',members: [{ _id: 0, host: \'"localhost"\' }] }).ok } catch (_) { rs.status().ok}") -eq 1',
            start_period: "5s",
            interval: "10s",
            timeout: "10s",
          },
          volumes: [`${mongodbVolumeName}:/var/lib/mongosql/data`],
        },
      },
      volumes: {
        [mongodbVolumeName]: null,
      },
    },
  ];

const DATASOURCE_NAME = "db";
const URL_NAME = "DB_URL";

export const dataSource: DataSource = {
  name: DATASOURCE_NAME,
  provider: DataSourceProvider.MongoDB,
  url: {
    name: URL_NAME,
  },
};
