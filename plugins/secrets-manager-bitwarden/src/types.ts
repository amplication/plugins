export interface Settings {
  BITWARDEN_ACCESS_TOKEN: string;
  BITWARDEN_ORGANISATION_ID: string;
  fetchMode: FetchMode;
  secretNames: string[];
}

export enum FetchMode {
  Startup = "STARTUP",
  OnDemand = "ON_DEMAND",
}
