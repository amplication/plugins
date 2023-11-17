import { VariableDictionary } from "@amplication/code-gen-types";
import { resolve } from "path";

export const envVariables: VariableDictionary = [{ AWS_REGION: "us-east-1" }];

export const dependencies = {
  dependencies: {
    "@aws-sdk/client-secrets-manager": "^3.438.0",
  },
};
