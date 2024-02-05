export interface Settings {
  awsRegion: string;
  fetchMode: string;
  secretNames: string[];
}

export enum FetchMode {
  Startup = "STARTUP",
  OnDemand = "ON_DEMAND",
}
