export interface Settings {
  port: number;
  realmName?: string;
  realmID: string;
  clientName?: string;
  clientDescription?: string;
  clientID: string;
  adminUsername?: string;
  adminPassword?: string;
  recipe: IRecipe;
  defaultUser?: Record<string, unknown>;
}

export interface IRecipe {
  emailFieldName: string;
  verifyEmail: boolean;
  registrationAllowed: boolean;
  payloadFieldMapping: Record<string, string>;
}
