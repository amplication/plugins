/**
 * @Amplication example types file.
 * Add here all your typescript types/enum/interfaces
 */

export interface Settings {
  root_level: boolean;
  directory_name: string;
  server: {
    chart_version: string;
    application_version: string;
    repository: string;
    tag: string;
    hostname: string;
  };
  admin_ui?: {
    chart_version: string;
    application_version: string;
    repository: string;
    tag: string;
    hostname: string;
  };
} //TODO: create a json schema for this settings interface
