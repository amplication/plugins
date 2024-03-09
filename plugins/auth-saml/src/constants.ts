import { CreateServerDockerComposeParams } from "@amplication/code-gen-types";
import { join } from "path";

export const serverStaticsPath = join(__dirname, "static", "server");
export const clientStaticPath = join(__dirname, "static", "client");
export const templatesPath = join(__dirname, "templates");

export const AUTH_ENTITY_ERROR = "Authentication entity does not exist";
export const AUTH_ENTITY_LOG_ERROR =
  "Authentication entity does not exist. Have you configured the authentication entity in the Resource Settings?";
export const AUTH_ENTITY_FIELD_USERNAME = "username";
export const AUTH_ENTITY_FIELD_SESSION_ID = "sessionId";

export const updateDockerComposeProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        server: {
          environment: {
            JWT_SECRET_KEY: "${JWT_SECRET_KEY}",
            JWT_EXPIRATION: "${JWT_EXPIRATION}",
            SAML_ENTRY_POINT: "${SAML_ENTRY_POINT}",
            SAML_ISSUER: "${SAML_ISSUER}",
            SAML_DECRYPT_KEY: "${SAML_DECRYPT_KEY}",
            SAML_PRIVATE_CERT: "${SAML_PRIVATE_CERT}",
            SAML_PUBLIC_CERT: "${SAML_PUBLIC_CERT}",
            SAML_REDIRECT_CALLBACK_URL: "${SAML_REDIRECT_CALLBACK_URL}",
          },
        },
      },
    },
  ];
