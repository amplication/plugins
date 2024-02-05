# @amplication/plugin-secrets-manager-azure-key-vault

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-secrets-manager-azure-key-vault)](https://www.npmjs.com/package/@amplication/plugin-secrets-manager-azure-key-vault)

Amplication plugin that allows easy management of secrets by using Azure Key Vault.

## Purpose

This purpose of this plugin is to easily and securely use secrets from Azure Key Vault.

## Configuration

The plugins are fetched by two methods:

- `STARTUP` - In this method, the plugins are fetched during the startup time (Initially loaded).
- `ON_DEMAND` - In this method, the plugins are fetched during the runtime (Loaded when the secrets are needed).

You need to define also a property named `secretNames` that will contain a list of the secrets that the service needs to interact with (see below for the formatting of the secret name).

Example:

```json
"fetchMode": "STARTUP",
"secretNames": [
    "SecretA:Version1",
    "SecretB",
    "SecretC:Version2",
    "SecretD:Version1"
]

```

## Secret name format

The secret name must be formatted in either of the following way:

- `<secret_name>:<secret_version>` - This format specifies that a secret named `secret_name` and version `secret_version` needs to be loaded.
- `<secret_name>` - This format specifies that the secret named `secret_name` of latest version needs to be loaded.

## Usage

To use this plugin:

1. Enable the plugin in your Amplication app.
2. Make sure to [setup your credentials](https://www.npmjs.com/package/@azure/identity#authenticate-via-the-azure-cli) that will be used to fetch the secrets.
3. In your server's `.env`, change the `AZURE_VAULT_NAME` to the name of the vault from where the secrets will be pulled.

This plugin will override your default implementation for `SecretsManagerService` to use the secrets from Azure Key Vault.

## Scripts

### `build`

Running `npm run build` will bundle your plugin with Webpack for production.

### `dev`

Running `npm run dev` will watch your plugin's source code and automatically bundle it with every change.
