import { join } from "path";

export const clientStaticPath = join(__dirname, "static", "client");
export const serverStaticPath = join(__dirname, "static", "server");
export const templatesPath = join(__dirname, "templates");

export const adminUIPackageJsonValues = {
  dependencies: {
    "jwt-decode": "^4.0.0",
    "keycloak-js": "^23.0.3",
  },
};

export const serverPackageJsonValues = {
  dependencies: {
    "jwks-rsa": "^3.1.0",
  },
};

export const AUTH_ENTITY_ERROR = "Authentication entity does not exist";
export const AUTH_ENTITY_LOG_ERROR =
  "Authentication entity does not exist. Have you configured the authentication entity in the Resource Settings?";
export const EmailError = (
  entityName: string,
  fieldName: string,
  propertyName: string,
) =>
  `The entity ${entityName} does not have a field named ${fieldName} specified in the ${propertyName} property or the field is not of type Email. Please add a field named ${fieldName} of type Email to the entity ${entityName} or change the ${propertyName} property in the recipe`;

export const placeholders = {
  port: "${{ KEYCLOAK_PORT }}",
  realmID: "${{ KEYCLOAK_REALM_ID }}",
  realmName: "${{ KEYCLOAK_REALM_NAME }}",
  clientID: "${{ KEYCLOAK_CLIENT_ID }}",
  clientName: "${{ KEYCLOAK_CLIENT_NAME }}",
  clientDescription: "${{ KEYCLOAK_CLIENT_DESCRIPTION }}",
};

export const dockerComposeDevValues = [
  {
    services: {
      keycloak: {
        image: "quay.io/keycloak/keycloak",
        command: "-v start-dev --import-realm",
        restart: "always",
        ports: ["${KEYCLOAK_PORT}:8080"],
        environment: {
          KEYCLOAK_USER: "${KEYCLOAK_ADMIN_USERNAME}",
          KEYCLOAK_PASSWORD: "${KEYCLOAK_ADMIN_PASSWORD}",
          KEYCLOAK_IMPORT: "/opt/keycloak/data/import/realm-export.json",
        },
        volumes: ["./src/keycloak:/opt/keycloak/data/import"],
      },
    },
  },
];

export const dockerComposeProdValues = [
  {
    services: {
      keycloak: {
        ...dockerComposeDevValues[0].services.keycloak,
        depends_on: ["db"],
      },
    },
  },
];
