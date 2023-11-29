export interface Settings {
  authMode: string;
  fetchMode: string;
  secretNames: string[];
}

export enum FetchMode {
  Startup = "STARTUP",
  OnDemand = "ON_DEMAND",
}
