export type AdditionalProperties = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export interface Settings {
  logLevel: string;
  logRequests: boolean;
  request: {
    sensitiveKeys: string[];
    ignoreKeys: string[];
    logKeys: string[];
  };
  response: {
    sensitiveKeys: string[];
    ignoreKeys: string[];
    logKeys: string[];
  };
  additionalLogProperties: AdditionalProperties;
}
