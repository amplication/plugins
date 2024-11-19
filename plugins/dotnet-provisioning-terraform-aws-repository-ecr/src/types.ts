export enum RepositoryType {
  Public = "public",
  Private = "private",
}

export interface Settings {
  repository_type: RepositoryType;
  repository_name: string;
  configuration: {
    force_delete: boolean;
  };
}
