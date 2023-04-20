export enum RegistryProviders {
  GitHub = "github",
}

export enum GitHubAuthenticationMethods {
  PersonalAccessToken = "pat",
}

export interface Settings {
  registry?: RegistryProviders;
  configuration?: {
    registry_path: string;
    authentication_method?: string;
  };
} //TODO: create a json schema for this settings interface
