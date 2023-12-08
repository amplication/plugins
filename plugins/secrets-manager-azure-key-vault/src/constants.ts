import { VariableDictionary } from "@amplication/code-gen-types";
import { resolve } from "path";

export const envVariables: VariableDictionary = [{
  AZURE_VAULT_NAME: "vault"
}];

export const dependencies = {
  dependencies: {
    "@azure/identity": "^4.0.0",
    "@azure/keyvault-secrets": "^4.7.0",
  },
};
