export interface Settings {
  domain: string;
  clientId: string;
  audience: string;
  issuerURL: string;
  recipe: IRecipe;
  defaultUser: Record<string, unknown>;
}

export interface IRecipe {
  type: "password" | "passwordless";
  method?: "email" | "sms" | "magic-link";
  emailFieldName: string;
  payloadFieldMapping: Record<string, string>;
}
