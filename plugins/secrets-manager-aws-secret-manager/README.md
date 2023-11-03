# @amplication/plugin-secrets-manager-aws-secret-manager

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-aws-secrets-manager)](https://www.npmjs.com/package/@amplication/plugin-secrets-manager-aws-secret-manager)

Amplication plugin that allows easy management of secrets by using AWS Secrets Manager.

## Purpose

This purpose of this plugin is to easily and securely use secrets from AWS Secrets Manager.

## Configuration

The plugins are fetched by two methods:

- `STARTUP` - In this method, the plugins are fetched during the startup time (Initially loaded).
- `ON_DEMAND` - In this method, the plugins are fetched during the runtime (Loaded when the secrets are needed).

If you are choosing the `STARTUP` method, you need to define another property named `secretNames` that will contain a list of the secrets that needs to be loaded during startup time (see below for the formatting of the secret name).

Example:

```json
"fetchMode": "STARTUP",
"secretNames": [
    "/secretA",
    "/path/path2/secretB",
    "/path/path2/path3/secretC"
]

```

## Secret name format

The secret name must be formatted in either of the following way:

- `<secret_path>:<secret_name>` - This format specifies that a single secret named `secret_name` needs to be loaded from the `secret_path` path [applies to both fetch mode].
- `<secret_path>` - This format specifies that all the secrets that are in the `secret_path` needs to be loaded [only applies to `STARTUP` fetch mode].

## Usage

To use this plugin:

1. Enable the plugin in your Amplication app.
2. Make sure to [setup your credentials](https://docs.aws.amazon.com/sdkref/latest/guide/creds-config-files.html) locally that will be used to fetch the secrets.

This plugin will override your default implementation for `SecretsManagerService` to use the secrets from AWS Secrets Manager

## Scripts

### `build`

Running `npm run build` will bundle your plugin with Webpack for production.

### `dev`

Running `npm run dev` will watch your plugin's source code and automatically bundle it with every change.
