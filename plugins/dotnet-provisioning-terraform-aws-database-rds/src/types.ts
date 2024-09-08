export interface Settings {
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
    maintenance: {
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
  /*
  mysql?: {}
  */
}

type PostgresSettings = Required<Settings> & Omit<Settings, "mysql">;

export function isPostgresSettings(
  settings: Settings
): settings is PostgresSettings {
  return (settings as PostgresSettings).postgres !== undefined;
}
