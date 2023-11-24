import * as React from "react";
import { useState } from "react";
import { useNotify, Notification, defaultTheme } from "react-admin";
import { ThemeProvider } from "@material-ui/styles";
import { createTheme } from "@material-ui/core/styles";
import { Button } from "@material-ui/core";
import Passwordless from "supertokens-web-js/recipe/passwordless";
import { parsePhoneNumber } from "libphonenumber-js";
import "./login.scss";

const CLASS_NAME = "login-page";

const Login = ({ theme }: any) => {
  const [shouldClickMagicLink, setShouldClickMagicLink] = useState(false);
  const notify = useNotify();
  const BASE_URI = process.env.REACT_APP_SERVER_URL;
  const moveToNextStep = () => {
    setShouldClickMagicLink(true);
  };

  return (
    <ThemeProvider theme={createTheme(defaultTheme)}>
      <div className={`${CLASS_NAME}`}>
        <div className={`${CLASS_NAME}__wrapper`}>
          <div className={`${CLASS_NAME}__box`}>
            <img
              src="https://amplication.com/assets/react-admin.png"
              alt="React-Admin"
            />
            <h2>Admin UI</h2>
            <div className={`${CLASS_NAME}__box__message`}>
              Sign in to a React-Admin client with ready-made forms for creating
              and editing all the data models of your application
            </div>
            {shouldClickMagicLink ? (
              <h3>A link has been sent</h3>
            ) : (
              <CreateOTPForm notify={notify} moveToNextStep={moveToNextStep} />
            )}
          </div>
          <div className={`${CLASS_NAME}__box`}>
            <img
              src="https://amplication.com/assets/restapi.png"
              alt="REST API"
            />
            <h2>Connect via REST API</h2>
            <div className={`${CLASS_NAME}__box__message`}>
              Connect to the server using REST API with a built-in Swagger
              documentation
            </div>
            <Button
              type="button"
              variant="contained"
              color="primary"
              href={`${BASE_URI}/api`}
            >
              Continue
            </Button>
          </div>

          <Notification />
        </div>
        <div className={`${CLASS_NAME}__read-more`}>
          <span>Read </span>
          <a href="https://docs.amplication.com/api" target="docs">
            Amplication docs
          </a>
          <span> to learn more</span>
        </div>
      </div>
    </ThemeProvider>
  );
};

const CreateOTPForm = ({ notify, moveToNextStep }: any) => {
  const [emailOrPhoneNumber, setEmailOrPhoneNumber] = useState("");
  const submit = async (e: any) => {
    e.preventDefault();
    let input: any = { email: emailOrPhoneNumber };
    try {
      const parsedPhoneNumber = parsePhoneNumber(emailOrPhoneNumber);
      if (parsedPhoneNumber && parsedPhoneNumber.isValid()) {
        input = { phoneNumber: parsedPhoneNumber };
      }
    } catch (e) {}
    if (input.email) {
      const resp = await Passwordless.doesEmailExist({ email: input.email });
      if (resp.status !== "OK" || !resp.doesExist) {
        notify("Failed to login");
        return;
      }
    } else {
      const resp = await Passwordless.doesPhoneNumberExist({
        phoneNumber: input.phoneNumber,
      });
      if (resp.status !== "OK" || !resp.doesExist) {
        notify("Failed to login");
        return;
      }
    }
    const resp = await Passwordless.createCode(input);
    if (resp.status === "OK") {
      moveToNextStep();
    } else {
      notify("Failed to login");
    }
  };

  return (
    <form onSubmit={submit}>
      <label>
        <span>{CONTACT_METHOD_FIELD_LABEL}</span>

        <input
          name="emailOrPhoneNumber"
          type="text"
          value={emailOrPhoneNumber}
          onChange={(e) => setEmailOrPhoneNumber(e.target.value)}
        />
      </label>
      <Button type="submit" variant="contained" color="primary">
        Continue
      </Button>
    </form>
  );
};

export default Login;
