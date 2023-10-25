export interface Settings {
  AUTH0_DOMAIN: string;
  AUTH0_CLIENT_ID: string;
  AUTH0_AUDIENCE: string;
  AUTH0_ISSUER_URL: string;
  recipe: {
    type: "password" | "passwordless";
    method: "email" | "sms" | "magic-link";
    emailField: string;
  };
  defaultUser: Record<string, unknown>;
}
