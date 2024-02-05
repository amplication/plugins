export interface Settings {
  fetchMode: string;
  gcpResourceId: string;
  secretNames: string[];
}

export enum FetchMode {
  Startup = "STARTUP",
  OnDemand = "ON_DEMAND",
}
