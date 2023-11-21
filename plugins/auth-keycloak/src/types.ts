export interface Settings {
  KEYCLOAK_HOST: string;
  KEYCLOAK_REALM: string;
  KEYCLOAK_CLIENT_ID: string;
  KEYCLOAK_CLIENT_SECRET: string;
  KEYCLOAK_CALLBACK_URL: string;
  KEYCLOAK_AUTHORIZATION_URL: string;
  KEYCLOAK_TOKEN_URL: string;
  KEYCLOAK_USERINFO_URL: string;
  recipe: IRecipe;
}

export interface IRecipe {
  type: "password" | "passwordless";
  method?: "email" | "sms" | "magic-link";
  emailFieldName: string;
  payloadFieldMapping: Record<string, string>;
}