export interface Settings {
  settings: {
    BITWARDEN_ACCESS_TOKEN: string
    BITWARDEN_ORGANISATION_ID: string
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
