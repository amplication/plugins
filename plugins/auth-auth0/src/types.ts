export interface Settings {
  domain: string;
  clientId: string;
  audience: string;
  issuerURL: string;
  recipe: {
    type: "password" | "passwordless";
    method: "email" | "sms" | "magic-link";
    emailField: string;
    payloadFieldMapping: Record<string, string>;
  };
  defaultUser: Record<string, unknown>;
}
