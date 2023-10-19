import { SuperTokensInfo, AppInfo } from "supertokens-node/types";

export type AuthModuleConfig = {
  appInfo: {
    websiteDomain: string;
  } & Omit<AppInfo, "websiteDomain">;
  supertokens: SuperTokensInfo;
};
