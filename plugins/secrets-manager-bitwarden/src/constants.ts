import { VariableDictionary } from "@amplication/code-gen-types"

export const dependencies = {
    dependencies: {
        "@bitwarden/sdk-napi": "^0.3.1"
    },
}

export const envVariables: VariableDictionary = [
    {BITWARDEN_ACCESS_TOKEN: ""},
    {BITWARDEN_ORGANISATION_ID: ""},
    {BITWARDEN_API_URL: "https://api.bitwarden.com"},
    {BITWARDEN_IDENTITY_URL: "https://identity.bitwarden.com"},
]
