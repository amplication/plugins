export type AdditionalProperties = {
  [key: string]: any;
};

export interface Settings {
  logLevel: string;
  additionalLogProperties: AdditionalProperties;
}
