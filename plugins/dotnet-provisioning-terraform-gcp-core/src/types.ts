export enum BackendTypes {
  Gcs = "gcs",
  Local = "local",
}

export interface EnvironmentConfig {
  cidr: string;
  teams: string[];
}

export interface Settings {
  root_level: boolean;
  directory_name: string;
  global: {
    organization_id: string;
    billing_account: string;
    billing_project: string;
    domain: string;
    region_prefix: string;
  };
  environments: {
    [environment: string]: EnvironmentConfig;
  };
  backend: {
    type: string;
    local?: {
      path: string;
    };
    gcs?: {
      bucket: string;
      prefix: string;
    };
  };
}
