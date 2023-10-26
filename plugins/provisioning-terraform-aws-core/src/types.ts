export enum BackendTypes {
  S3 = "s3",
  Local = "local",
}

export interface Settings {
  root_level: boolean;
  directory_name: string;
  global: {
    name: string;
    region: string;
    environment: string;
  };
  vpc: {
    cidr_block: string;
    create_database_subnet_group: boolean;
    enable_dns_hostnames: boolean;
    enable_dns_support: boolean;
    enable_nat_gateway: boolean;
    single_nat_gateway: boolean;
  };
  backend: {
    type: string;
    local?: {
      path: string;
    };
    s3?: {
      bucket_name: string;
      key: string;
      region: string;
    };
  };
}
