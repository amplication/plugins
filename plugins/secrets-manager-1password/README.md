# @amplication/plugin-secrets-manager-1password

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-secrets-manager-1password)](https://www.npmjs.com/package/@amplication/plugin-secrets-manager-1password)

Amplication plugin that allows easy management of secrets by using 1Password.

## Purpose

This purpose of this plugin is to easily and securely use secrets by using 1Password. Documentation for [1Passwordk-sdk](https://developer.1password.com/docs/connect/
)

## Configuration

The plugins are fetched by two methods:

- `STARTUP` - In this method, the plugins are fetched during the startup time (Initially loaded).
- `ON_DEMAND` - In this method, the plugins are fetched during the runtime (Loaded when the secrets are needed).

If you are choosing the `STARTUP` method, you need to define another property named `secretNames` that will contain a list of the secrets that needs to be loaded during startup time (see below for the formatting of the secret name).

Example:

```json
"fetchMode": "STARTUP",
"secretNames": [
    "secretA_Id",
    "secretB_Id",
    "SecretC_Id"
]

```

## Secret name format

The secret name must be formatted in the following way:

- `<secret_id>` - This format specifies that a single secret which needs to be loaded from `secret_id` [applies to both fetch mode].

## Usage

To use this plugin:

1. Get 1Passwork-Connect token by following:
    * Sign in to your account on 1Password.com.
    * Select Developer Tools from the sidebar.
    * Under Infrastructure Secrets Management, select Other.
    * Select "Create a Connect server".
    * Follow the onscreen instructions to create a `1password-credentials.json` file and `Connect token`.
2. Update the `connect token` and `serverURL` in `.amplicationrc.json`

This plugin will override your default implementation for `SecretsManagerService` to use the secrets from AWS Secrets Manager

## Scripts

### `build`

Running `npm run build` will bundle your plugin with Webpack for production.

### `dev`

Running `npm run dev` will watch your plugin's source code and automatically bundle it with every change.

