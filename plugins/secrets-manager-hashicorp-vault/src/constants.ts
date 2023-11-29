import {
  CreateServerDockerComposeParams,
  VariableDictionary,
} from "@amplication/code-gen-types";
import { resolve } from "path";

export const envVariablesAuthToken: VariableDictionary = [
  {
    VAULT_TOKEN: "your-root-token",
  },
];

export const envVariablesAppRole: VariableDictionary = [
  { SECRET_ID: "your-secret-id" },
  { ROLE_ID: "your-role-id" },
];

export const dependencies = {
  dependencies: {
    "node-vault": "^0.10.2",
  },
};

export const authModeToken = `
vault.token = configService.getOrThrow("VAULT_TOKEN");
`;

export const authModeAppRole = `
const result = await vault.approleLogin({
  role_id: configService.getOrThrow("ROLE_ID"),
  secret_id: configService.getOrThrow("SECRET_ID")
})

vault.token = result.auth.client_token ?? "";
`;

export const configs = resolve(__dirname, "static", "configs");

export const updateDockerComposeProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        vault: {
          image: "hashicorp/vault",
          restart: "on-failure:10",
          cap_add: ["IPC_LOCK"],
          ports: ["${VAULT_PORT}:8200"],
          command: "server",
          volumes: [
            "vault-data:/vault/file",
            "$PWD/config.hcl:/vault/config/config.hcl",
          ],
        },
      },
      volumes: {
        "vault-data": null,
      },
    },
  ];

export const updateDockerComposeDevProperties: CreateServerDockerComposeParams["updateProperties"] =
  [
    {
      services: {
        vault: {
          image: "hashicorp/vault",
          restart: "on-failure:10",
          cap_add: ["IPC_LOCK"],
          ports: ["${VAULT_PORT}:8200"],
          command: "server",
          volumes: [
            "vault-data:/vault/file",
            "$PWD/config.dev.hcl:/vault/config/config.hcl",
          ],
        },
      },
      volumes: {
        "vault-data": null,
      },
    },
  ];
