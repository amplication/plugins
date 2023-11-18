export interface Settings {
  settings: {
    fetchMode: FetchMode,
    secretNames: string[]
  },
  systemSettings: {
    requireAuthenticationEntity: string
  }
}

export enum FetchMode {
  Startup = "STARTUP",
  OnDemand = "ON_DEMAND",
}
