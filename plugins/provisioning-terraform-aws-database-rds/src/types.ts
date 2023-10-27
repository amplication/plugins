export enum DatabaseTypes {
  Postgres = "postgres",
}

export interface Settings {
  database: {
    type: DatabaseTypes;
    postgres?: {
      identifier: string;
      instance_class: string;
      database_name: string;
      username: string;
      port: number;
      storage: {
        allocated: number;
        maximum: number;
      };
      maintainance: {
        window: string;
      };
      backup: {
        window: string;
        retention_period: number;
      };
      security_group: {
        name: string;
      };
    };
  };
}
