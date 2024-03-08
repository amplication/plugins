import { AuthProvider } from "react-admin";
import {
  CREDENTIALS_LOCAL_STORAGE_ITEM,
  USER_DATA_LOCAL_STORAGE_ITEM,
} from "../constants";

export function createBearerAuthorizationHeader(accessToken: string) {
  return `Bearer ${accessToken}`;
}

export const samlAuthProvider: AuthProvider = {
  async handleCallback() {
    const queryParameters = new URLSearchParams(window.location.search);
    console.log("queryParameters", queryParameters);
    const code = queryParameters.get("code");

    if (code) {
      localStorage.setItem(
        CREDENTIALS_LOCAL_STORAGE_ITEM,
        createBearerAuthorizationHeader(code)
      );

      return { redirectTo: "/" };
    }
    return Promise.reject();
  },
  login: async () => {
    window.location.replace(`${process.env.REACT_APP_SERVER_URL}/api/login`);
  },
  logout: () => {
    localStorage.removeItem(CREDENTIALS_LOCAL_STORAGE_ITEM);
    return Promise.resolve();
  },
  checkError: ({ status }: any) => {
    if (status === 401 || status === 403) {
      localStorage.removeItem(CREDENTIALS_LOCAL_STORAGE_ITEM);
      return Promise.reject();
    }
    return Promise.resolve();
  },
  checkAuth: () => {
    const queryParameters = new URLSearchParams(window.location.search);
    const code = queryParameters.get("code");

    if (code) {
      localStorage.setItem(
        CREDENTIALS_LOCAL_STORAGE_ITEM,
        createBearerAuthorizationHeader(code)
      );
      window.location.search = "";
    }
    return localStorage.getItem(CREDENTIALS_LOCAL_STORAGE_ITEM)
      ? Promise.resolve()
      : Promise.reject();
  },
  getPermissions: () => Promise.reject("Unknown method"),
  getIdentity: async () => {
    return Promise.resolve({
      id: "",
      fullName: "",
      avatar: undefined,
    });
  },
};
