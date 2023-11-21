export interface Settings {
  KEYCLOAK_HOST: string;
  KEYCLOAK_REALM: string;
  KEYCLOAK_CLIENT_ID: string;
  KEYCLOAK_CLIENT_SECRET: string;
  KEYCLOAK_CALLBACK_URL: string;
}

export interface IRecipe {
  type: "password" | "passwordless";
  method?: "email" | "sms" | "magic-link";
  emailFieldName: string;
  payloadFieldMapping: Record<string, string>;
}