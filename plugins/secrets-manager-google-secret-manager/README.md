# @amplication/plugin-secrets-manager-aws-secret-manager

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-google-secret-manager)](https://www.npmjs.com/package/@amplication/plugin-secrets-manager-google-secret-manager)

Amplication plugin that allows easy management of secrets by using Google Secrets Manager.

## Purpose

This purpose of this plugin is to easily and securely use secrets from Google Secrets Manager.

## Configuration

The secrets are fetched by two methods:

- `STARTUP` - In this method, the secrets are fetched during the startup time (Initially loaded).
- `ON_DEMAND` - In this method, the secrets are fetched during the runtime (Loaded when the secrets are needed).

You need to define also a property named `secretNames` that will contain a list of the secrets that the service needs to interact with (see below for the formatting of the secret name).

Example:

```json
"fetchMode": "STARTUP",
"secretNames": [
    "SecretA:1",
    "SecretB:2",
    "SecretC:3",
]

```

## Secret name format

- `<secret_name>:<secret_version>` where `<secret_name>` is the name of the secrets that you want to load and the `<secret_version>` is the version of the secret to load.

## Usage

To use this plugin:

1. Enable the plugin in your Amplication app.
2. Make sure to [setup your Application Default Credentials](https://cloud.google.com/docs/authentication/provide-credentials-adc) that will be used to fetch the secrets.
3. Inside of the server's `.env`, change the `GCP_RESOURCE_ID` to your resource id from where the plugins will be fetched.

This plugin will override your default implementation for `SecretsManagerService` to use the secrets from Google Secrets Manager

## Scripts

### `build`

Running `npm run build` will bundle your plugin with Webpack for production.

### `dev`

Running `npm run dev` will watch your plugin's source code and automatically bundle it with every change.
