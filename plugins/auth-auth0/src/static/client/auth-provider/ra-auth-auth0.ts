import { Auth0Client } from "@auth0/auth0-spa-js";
import { AuthProvider, UserIdentity } from "react-admin";

export const PreviousLocationStorageKey = "@react-admin/nextPathname";

export const client = new Auth0Client({
  domain: process.env.VITE_REACT_APP_AUTH0_DOMAIN || "",
  clientId: process.env.VITE_REACT_APP_AUTH0_CLIENT_ID || "",
  cacheLocation: "localstorage",
  authorizationParams: {
    audience: process.env.VITE_REACT_APP_AUTH0_AUDIENCE,
    scope: "openid profile email",
  },
  useRefreshTokens: true,
});

export const auth0AuthProvider: AuthProvider = {
  login: async () => {
    await client.loginWithPopup({
      authorizationParams: {
        redirect_uri: process.env.VITE_REACT_APP_AUTH0_REDIRECT_URI,
      },
    });

    return Promise.resolve();
  },

  logout: async () => {
    await client.logout({
      logoutParams: {
        returnTo: process.env.VITE_REACT_APP_AUTH0_LOGOUT_REDIRECT_URI,
      },
    });

    return Promise.resolve();
  },

  async checkAuth() {
    const isAuthenticated = await client.isAuthenticated();
    if (isAuthenticated) {
      return Promise.resolve();
    }

    localStorage.setItem(PreviousLocationStorageKey, window.location.href);

    return Promise.reject();
  },

  checkError: async ({ status }) => {
    if (status === 401 || status === 403) {
      throw new Error("Unauthorized");
    }
  },

  getPermissions: async () => {
    if (!(await client.isAuthenticated())) {
      return;
    }

    await client.getIdTokenClaims();
    Promise.resolve();
  },

  getIdentity: async () => {
    if (!(await client.isAuthenticated())) {
      throw new Error("User not authenticated");
    }

    const user = await client.getUser();

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.sub,
      fullName: user.name,
      avatar: user.picture,
      email: user.email,
    } as UserIdentity;
  },

  handleCallback: async () => {
    const query = window.location.search;
    if (query.includes("code=") && query.includes("state=")) {
      try {
        await client.handleRedirectCallback();
        return;
      } catch (error) {
        throw new Error("Failed to handle login callback: " + error);
      }
    }
    throw new Error("Failed to handle login callback.");
  },
};
