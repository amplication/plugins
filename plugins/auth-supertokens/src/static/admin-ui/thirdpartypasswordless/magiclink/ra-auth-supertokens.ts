import { AuthProvider } from "react-admin";
import Session from "supertokens-web-js/recipe/session";

export const supertokensAuthProvider: AuthProvider = {
  login: async (credentials: any) => {
    return Promise.reject();
  },
  logout: async () => {
    await Session.signOut();
    return Promise.resolve();
  },
  checkError: ({ status }: any) => {
    if (status === 401 || status === 403) {
      return Promise.reject();
    }
    return Promise.resolve();
  },
  checkAuth: async () => {
    if(await Session.doesSessionExist()) {
      return Promise.resolve();
    }
    return Promise.reject();
  },
  getPermissions: () => Promise.reject("Unknown method"),
  getIdentity: async () => {
    const payload = await Session.getAccessTokenPayloadSecurely();
    
    return Promise.resolve({
      id: payload.userId,
      fullName: payload.email ?? payload.phoneNumber ?? payload.userId,
      avatar: undefined,
    });
  },
};
