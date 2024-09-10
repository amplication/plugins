import * as React from "react";
import { getAuthorisationURLWithQueryParamsAndSetState } from "supertokens-web-js/recipe/thirdparty";
import { SuperTokensConfig } from "./config";


const LoginForm = ({ theme }: any) => {
  const BASE_URI = process.env.REACT_APP_SERVER_URL;

  return (
    <>
    {SIGN_IN_BUTTONS}

    </>

  );
};

const signInClicked = (thirdPartyId: string) => {
  return async () => {
    try {
      const authUrl = await getAuthorisationURLWithQueryParamsAndSetState({
        thirdPartyId: thirdPartyId,

        // This is where the provider should redirect the user back after login or error.
        // This URL goes on the provider's dashboard as well.
        frontendRedirectURI: `${SuperTokensConfig.appInfo.websiteDomain}/auth/callback/`,
        // Only needed with Apple
        // Apple sends a POST request here which is handled by the SuperTokens middleware
        // SuperTokens then redirects the user to frontendRedirectURI
        redirectURIOnProviderDashboard: `${SuperTokensConfig.appInfo.apiDomain}/auth/callback/${thirdPartyId}`,
      });

      /*
        Example value of authUrl: https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&access_type=offline&include_granted_scopes=true&response_type=code&client_id=1060725074195-kmeum4crr01uirfl2op9kd5acmi9jutn.apps.googleusercontent.com&state=5a489996a28cafc83ddff&redirect_uri=https%3A%2F%2Fsupertokens.io%2Fdev%2Foauth%2Fredirect-to-app&flowName=GeneralOAuthFlow
        */

      // we redirect the user to google for auth.
      window.location.assign(authUrl);
    } catch (err: any) {
      if (err.isSuperTokensGeneralError === true) {
        // this may be a custom error message sent from the API by you.
        window.alert(err.message);
      } else {
        window.alert("Oops! Something went wrong.");
      }
    }
  };
};

export default LoginForm;
