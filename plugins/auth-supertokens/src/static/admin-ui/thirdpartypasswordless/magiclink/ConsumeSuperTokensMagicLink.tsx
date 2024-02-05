import { useEffect } from "react";
import PasswordlessThirdParty from "supertokens-web-js/recipe/thirdpartypasswordless";

const ConsumeSuperTokensMagicLink = () => {
  useEffect(() => {
    PasswordlessThirdParty.consumePasswordlessCode()
      .then((resp) => {
        if (resp.status === "OK") {
          window.location.assign("/");
        } else {
          window.alert("Login failed.");
          window.location.assign("/login");
        }
      })
      .catch((err) => {
        if (err.isSuperTokensGeneralError === true) {
          window.alert(err.message);
        } else {
          window.alert("Something went wrong");
        }
      });
  }, []);

  return <p>Loading...</p>;
};

export default ConsumeSuperTokensMagicLink;
