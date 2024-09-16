import * as React from "react";
import { useState } from "react";
import { useLogin, useNotify } from "react-admin";
import { Button } from "@mui/material";


const LoginForm = ({ theme }: any) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();
  const notify = useNotify();
  const submit = async (e: any) => {
    e.preventDefault();
    login({ phoneNumber, password }).catch(() =>
      notify("Invalid phone number or password")
    );
  };

  return (
            <form onSubmit={submit}>
              <label>
                <span>Phone Number</span>

                <input
                  name="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
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
  );
};

export default LoginForm;
