import { VariableDictionary } from "@amplication/code-gen-types";
import { resolve } from "path";

export const envVariables: VariableDictionary = [
  { JWT_SECRET_KEY: "Change_ME!!!" },
  { JWT_EXPIRATION: "2d" },
];

export const templatesPath = resolve(__dirname, "./templates");
export const AUTH_ENTITY_ERROR = "Authentication entity does not exist";
export const AUTH_ENTITY_LOG_ERROR =
  "Authentication entity does not exist. Have you configured the authentication entity in the Resource Settings?";
  export const AUTH_ENTITY_FIELD_ROLES = "roles";
