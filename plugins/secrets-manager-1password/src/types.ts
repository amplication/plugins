export interface Settings {
  awsRegion: string;
  fetchMode: string;
  secretNames: string[];
  OnePasswordToken: string;
  serverURL: string;
}

export enum FetchMode {
  Startup = "STARTUP",
  OnDemand = "ON_DEMAND",
}
