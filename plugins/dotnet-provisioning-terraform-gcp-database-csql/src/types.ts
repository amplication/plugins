export enum DatabaseTypes {
  Postgres = "postgres",
}

export interface Settings {
  global: {
    name: string;
    environment: string;
    team: string;
    project_identifier: string;
    region: string;
    zone_suffix: string;
    tier: string;
    availability_type: string;
    disk_size: string;
    disk_type: string;
    charset: string;
    collation: string;
    deletion_protection: string;
    version: string;
  };
  configuration: {
    type: DatabaseTypes;
    postgres?: object; //TODO: settings that are specific to postgres
    mysql?: object; //TODO: settings that are specific to postgres
    mssql?: object; //TODO: settings that are specific to postgres
  };
}
