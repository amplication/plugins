import * as React from "react";
import { useState } from "react";
import { useNotify } from "react-admin";
import { Button } from "@mui/material";
import Passwordless from "supertokens-web-js/recipe/passwordless";
import { parsePhoneNumber } from "libphonenumber-js";

const LoginForm = ({ theme }: any) => {
  const [shouldClickMagicLink, setShouldClickMagicLink] = useState(false);
  const notify = useNotify();
  const moveToNextStep = () => {
    setShouldClickMagicLink(true);
  };

  return (
        <div>
            {shouldClickMagicLink ? (
              <h3>A link has been sent</h3>
            ) : (
              <CreateOTPForm notify={notify} moveToNextStep={moveToNextStep} />
            )}
          </div>  
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
    } catch (e) {
      // do nothing
    }
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

export default LoginForm;
