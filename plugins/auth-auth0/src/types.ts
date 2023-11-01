export interface Settings {
  domain?: string;
  clientID?: string;
  audience?: string;
  issuerURL?: string;
  recipe: IRecipe;
  useManagementApi: boolean;
  managementParams?: IManagementApiParams;
  defaultUser?: Record<string, unknown>;
}

export interface IManagementApiParams {
  accessToken: string;
  identifier: string;
  actionName?: string;
  clientName?: string;
  apiName?: string;
  audience?: string;
}

export interface IRecipe {
  type: "password" | "passwordless";
  method?: "email" | "sms" | "magic-link";
  emailFieldName: string;
  payloadFieldMapping: Record<string, string>;
}
