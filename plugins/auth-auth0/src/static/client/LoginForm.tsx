import * as React from "react";
import { useLogin, useNotify } from "react-admin";
import { Button } from "@mui/material";

const LoginForm = ({ theme }: any) => {
  const login = useLogin();
  const notify = useNotify();
  const submit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    notify("Redirecting to Auth0");
    login({});
  };


  return (
    <Button
    type="submit"
    variant="contained"
    color="primary"
    onClick={submit}
  >
    Log in
  </Button>
  );
};

export default LoginForm;
