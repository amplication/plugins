export interface Settings {
  port: number;
  realmID: string;
  clientID: string;
  recipe: IRecipe;
  realmName?: string;
  clientName?: string;
  clientDescription?: string;
  adminUsername?: string;
  adminPassword?: string;
  defaultUser?: Record<string, unknown>;
}

export interface IRecipe {
  emailFieldName?: string;
  verifyEmail: boolean;
  registrationAllowed: boolean;
  payloadFieldMapping?: Record<string, string>;
}
