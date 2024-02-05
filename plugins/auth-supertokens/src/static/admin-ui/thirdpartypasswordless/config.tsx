import PasswordlessThirdParty from "supertokens-web-js/recipe/thirdpartypasswordless";
import Session from "supertokens-web-js/recipe/session";

function getAppInfo() {
  if (!process.env.REACT_APP_SUPERTOKENS_APP_NAME) {
    throw new Error("The supertokens app name must be set");
  }
  if (!process.env.REACT_APP_SUPERTOKENS_API_DOMAIN) {
    throw new Error("The supertokens API domain must be set");
  }
  if (!process.env.REACT_APP_SUPERTOKENS_WEBSITE_DOMAIN) {
    throw new Error("The supertokens website domain must be set");
  }
  if (!process.env.REACT_APP_SUPERTOKENS_API_BASE_PATH) {
    throw new Error("The API base path must be set");
  }
  return {
    appName: process.env.REACT_APP_SUPERTOKENS_APP_NAME,
    apiDomain: process.env.REACT_APP_SUPERTOKENS_API_DOMAIN,
    websiteDomain: process.env.REACT_APP_SUPERTOKENS_WEBSITE_DOMAIN,
    apiBasePath: process.env.REACT_APP_SUPERTOKENS_API_BASE_PATH,
  };
}

export const SuperTokensConfig = {
  appInfo: getAppInfo(),
  recipeList: [PasswordlessThirdParty.init(), Session.init()],
};

export const recipeDetails = {
  docsLink: "https://supertokens.com/docs/emailpassword/introduction",
};
