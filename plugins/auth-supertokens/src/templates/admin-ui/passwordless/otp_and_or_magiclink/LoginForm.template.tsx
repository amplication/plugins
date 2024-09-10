import * as React from "react";
import { useState } from "react";
import {
  useLogin,
  useNotify,
} from "react-admin";
import { Button } from "@mui/material";
import Passwordless from "supertokens-web-js/recipe/passwordless";
import { parsePhoneNumber } from "libphonenumber-js";


const LoginForm = ({ theme }: any) => {
  const [shouldEnterOTP, setShouldEnterOTP] = useState(false);
  const login = useLogin();
  const notify = useNotify();
  const submit = async (otp: string) => {
    login({ otp }).catch((err) =>
      err ? notify(err) : notify("Failed to login")
    );
  };
  const moveToNextStep = () => {
    setShouldEnterOTP(true);
  };

  return (
    <>
        {shouldEnterOTP ? (
              <EnterOTPForm submit={submit} />
            ) : (
              <CreateOTPForm notify={notify} moveToNextStep={moveToNextStep} />
            )}
    </>
  
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
      if (input.email) {
        notify("Please check your email for the OTP");
      } else {
        notify("An SMS has been sent");
      }
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

const EnterOTPForm = ({ submit }: any) => {
  const [otp, setOTP] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(otp);
      }}
    >
      <label>
        <span>Enter OTP</span>
        <input
          name="OTP"
          type="text"
          value={otp}
          onChange={(e) => setOTP(e.target.value)}
        />
      </label>
      <Button type="submit" variant="contained" color="primary">
        Continue
      </Button>
    </form>
  );
};

export default LoginForm;
