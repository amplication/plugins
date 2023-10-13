import { Auth0Client } from "@auth0/auth0-spa-js";
import { AuthProvider, UserIdentity } from "react-admin";

export const PreviousLocationStorageKey = "@react-admin/nextPathname";

export const client = new Auth0Client({
  domain: process.env.REACT_APP_AUTH0_DOMAIN || "",
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID || "",
  cacheLocation: "localstorage",
  authorizationParams: {
    audience: process.env.REACT_APP_AUTH0_AUDIENCE,
    scope: "openid profile email",
  },
  useRefreshTokens: true,
});
