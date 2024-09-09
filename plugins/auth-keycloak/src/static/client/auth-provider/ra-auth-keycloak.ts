import Keycloak, { KeycloakConfig, KeycloakTokenParsed } from "keycloak-js";
import { AuthProvider } from "react-admin";
import { jwtDecode } from "jwt-decode";

const keycloakConfig: KeycloakConfig = {
  realm: process.env.VITE_REACT_APP_KEYCLOAK_REALM || "master",
  url: process.env.VITE_REACT_APP_KEYCLOAK_URL || "http://localhost:8080/auth",
  clientId: process.env.VITE_REACT_APP_KEYCLOAK_CLIENT_ID || "admin-ui",
};

export const keycloakClient = new Keycloak(keycloakConfig);

export const keycloakAuthProvider: (
  client: Keycloak,
  options: {
    loginRedirectUri?: string;
    logoutRedirectUri?: string;
  },
) => AuthProvider = (
  client: Keycloak,
  options: {
    loginRedirectUri?: string;
    logoutRedirectUri?: string;
  } = {},
) => {
  return {
    async login() {
      return client.login({
        redirectUri: options.loginRedirectUri ?? window.location.origin,
      });
    },
    async logout() {
      return client.logout({
        redirectUri: options.logoutRedirectUri ?? window.location.origin,
      });
    },
    async checkError() {
      return Promise.resolve();
    },
    async checkAuth() {
      return client.authenticated && client.token
        ? Promise.resolve()
        : Promise.reject("Failed to obtain access token.");
    },
    async getPermissions() {
      if (!client.token) {
        return Promise.resolve(false);
      }
      const decoded = jwtDecode<KeycloakTokenParsed>(client.token);
      return Promise.resolve(decoded);
    },
    async getIdentity() {
      if (client.token) {
        const decoded = jwtDecode<KeycloakTokenParsed>(client.token);
        const id = decoded.sub || "";
        const fullName = decoded.preferred_username;
        return Promise.resolve({ id, fullName });
      }
      return Promise.reject("Failed to get identity.");
    },
  };
};
