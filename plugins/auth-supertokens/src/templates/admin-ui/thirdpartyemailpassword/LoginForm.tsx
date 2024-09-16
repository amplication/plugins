import * as React from "react";
import { useState } from "react";
import { useLogin, useNotify, Notification, defaultTheme } from "react-admin";
import { Button } from "@mui/material";
import { getAuthorisationURLWithQueryParamsAndSetState } from "supertokens-web-js/recipe/thirdparty";
import { SuperTokensConfig } from "./config";


const LoginForm = ({ theme }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();
  const notify = useNotify();
  const submit = async (e: any) => {
    e.preventDefault();
    login({ email, password }).catch(() => notify("Invalid email or password"));
  };

  return (
<>
{SIGN_IN_BUTTONS}
            <p>or</p>
            <form onSubmit={submit}>
              <label>
                <span>Email</span>

                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                <span>Password</span>

                <input
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <Button type="submit" variant="contained" color="primary">
                Log in
              </Button>
            </form>
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
