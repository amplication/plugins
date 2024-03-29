import { CreateServerDockerComposeParams } from "@amplication/code-gen-types";
import { join } from "path";

export const staticsPath = join(__dirname, "static");
export const templatesPath = join(__dirname, "templates");

export const AUTH_ENTITY_ERROR = "Authentication entity does not exist";
export const AUTH_ENTITY_LOG_ERROR =
  "Authentication entity does not exist. Have you configured the authentication entity in the Resource Settings?";
export const AUTH_ENTITY_FIELD_USERNAME = "username";
export const AUTH_ENTITY_FIELD_PASSWORD = "password";

export const updateDockerComposeProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        server: {
          environment: {
            JWT_SECRET_KEY: "${JWT_SECRET_KEY}",
            JWT_EXPIRATION: "${JWT_EXPIRATION}",
          },
        },
      },
    },
  ];
