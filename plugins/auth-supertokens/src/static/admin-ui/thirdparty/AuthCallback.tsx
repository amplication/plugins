import { useEffect } from "react";
import { signInAndUp } from "supertokens-web-js/recipe/thirdparty";

const AuthCallback = () => {
  useEffect(() => {
    signInAndUp()
      .then((resp) => {
        if (resp.status === "OK") {
          window.location.assign("/");
        } else {
          window.alert("Failed to log in");
          window.location.assign("/login");
        }
      })
      .catch((err) => {
        if (err.isSuperTokensGeneralError === true) {
          window.alert(err.message);
        } else {
          window.alert("Oops! Something went wrong.");
        }
      });
  }, []);

  return <p>Loading...</p>;
};

export default AuthCallback;
