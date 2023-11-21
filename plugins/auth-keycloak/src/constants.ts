import { join } from "path";

export const staticsPath = join(__dirname, "static");
export const templatesPath = join(__dirname, "templates");

import { CreateServerDockerComposeParams } from "@amplication/code-gen-types";

const KC_DB_USERNAME = "keycloak-user";
const KC_DB_PASSWORD = "keycloak-db-password";

const KC_ADMIN_USER = "admin";
const KC_ADMIN_PASSWORD = "password";

export const updateDockerComposeProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        kc_postgres: {
          image: "postgres:13.2",
          restart: "unless-stopped",
          environment: {
            POSTGRES_DB: "keycloak",
            POSTGRES_USER: KC_DB_USERNAME,
            POSTGRES_PASSWORD: KC_DB_PASSWORD,
          },
        },
        keycloak: {
          image: "quay.io/keycloak/keycloak",
          command: "start", // --import-realm",
          restart: "always",
          ports: ["8180:8080"],
          environment: {
            KC_HEALTH_ENABLED: "true",
            KC_METRICS_ENABLED: "true",
            KC_DB: "postgres",
            KC_DB_URL: "kc_postgres",
            KC_DB_USERNAME: KC_DB_USERNAME,
            KC_DB_PASSWORD: KC_DB_PASSWORD,
            KC_HTTP_ENABLED: "true",
            KC_HOSTNAME_URL: "${KC_HOST}:8180",
            KEYCLOAK_ADMIN: KC_ADMIN_USER,
            KEYCLOAK_ADMIN_PASSWORD: KC_ADMIN_PASSWORD,
            JAVA_OPTS_APPEND:
              "-Dkeycloak.profile.feature.upload_scripts=enabled",
          },
          depends_on: ["kc_postgres"],
        },
      },
    },
  ];

export const updateDockerComposeDevProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        keycloak: {
          image: "quay.io/keycloak/keycloak",
          command: "start-dev",
          restart: "always",
          ports: ["8180:8080"],
          environment: {
            KEYCLOAK_ADMIN: KC_ADMIN_USER,
            KEYCLOAK_ADMIN_PASSWORD: KC_ADMIN_PASSWORD,
          },
        },
      },
    },
  ];

export const serverPackageJsonValues = {
  dependencies: {
    "exlinc/keycloak-passport": "^1.0.2",
  },
};

export const AUTH_ENTITY_ERROR = "Authentication entity does not exist";
export const AUTH_ENTITY_LOG_ERROR =
  "Authentication entity does not exist. Have you configured the authentication entity in the Resource Settings?";
