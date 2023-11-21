# @amplication/plugin-secrets-manager-hashicorp-vault

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-secrets-manager-hashicorp-vault)](https://www.npmjs.com/package/@amplication/plugin-secrets-manager-hashicorp-vault)

Amplication plugin that allows easy management of secrets by using HashiCorp Vault.

## Purpose

This purpose of this plugin is to easily and securely use secrets from HashiCorp Vault.

## Configuration

### Plugin Fetch Mode

The plugins are fetched by two methods:

- `STARTUP` - In this method, the plugins are fetched during the startup time (Initially loaded).
- `ON_DEMAND` - In this method, the plugins are fetched during the runtime (Loaded when the secrets are needed).

You need to define also a property named `secretNames` that will contain a list of the secrets that the service needs to interact with (see below for the formatting of the secret name).

Example:

```json
"fetchMode": "STARTUP",
"secretNames": [
    "/path/common",
    "/path/path1:SecretA",
    "/path/path2:SecretB",
    "/path/path2/path3:SecretC"
]

```

### Plugin auth mode

The plugin allows authentication by two methods:

- By using root token

  If you want to authenticate by using Root token, choose the `authMode` as `TOKEN`.
  To use this authentication mode, you need to set your root token inside of the `.env` file
  
- By using app role
  
  If you want to use AppRole mode, choose the `authMode` as `APPROLE`.
  To use this authentication mode, you need to set your Role Id and the Secret Id inside of the `.env` file

Example:

```json
"authMode": "APPROLE/TOKEN",
```

## Secret name format

The secret name must be formatted in either of the following way:

- `<secret_path>:<secret_name>` - This format specifies that a single secret named `secret_name` needs to be loaded from the `secret_path` path [applies to both fetch mode].
- `<secret_path>` - This format specifies that all the secrets that are in the `secret_path` needs to be loaded [only applies to `STARTUP` fetch mode].

## Usage

To use this plugin:

1. Enable the plugin in your Amplication app.
2. If you are using `AppRole` method, enable the AppRole access mode in dashboard.
3. Create ACL policy for the secrets and attach the policy to the AppRole method.

This plugin will override your default implementation for `SecretsManagerService` to use the secrets from HashiCorp Vault

## Scripts

### `build`

Running `npm run build` will bundle your plugin with Webpack for production.

### `dev`

Running `npm run dev` will watch your plugin's source code and automatically bundle it with every change.
