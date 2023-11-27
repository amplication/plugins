import { VariableDictionary } from "@amplication/code-gen-types";

export const envVariables: VariableDictionary = [{
    GCP_RESOURCE_ID: "12345678910"
}];

export const dependencies = {
    dependencies: {
        "@google-cloud/secret-manager": "^5.0.1"
    }
}
