# @amplication/plugin-bitwarden-secret-manager

[![NPM Downloads](https://img.shields.io/npm/dt/plugin-{your-plugin-name})](https://www.npmjs.com/package/plugin-{your-plugin-name})

Amplication plugin for managing secrets using the Bitwarden secrets manager.

## Purpose

This plugin provides a wrapper for the Bitwarden secret manager SDK which allows you to manage
secrets for your application using the Bitwarden secret manager.

## Configuration

The plugins are fetched by two methods:

- `STARTUP` - In this method, the plugins are fetched during the startup time (Initially loaded).
- `ON_DEMAND` - In this method, the plugins are fetched during the runtime (Loaded when the secrets are needed).

You need to define also a property named `secretNames` that will contain a list of the secrets that the service needs to interact with (see below for the formatting of the secret name).
Ensure that the secretNames match exactly with the keys from your bitwarden secret manager.

Example:

```json
"fetchMode": "STARTUP",
"secretNames": [
    "secretKey1",
    "secretKey2",
    "secretKey3"
]

```
## Usage

1. Enable the plugin from your Amplication app
when enabled, This plugin will override your default implementation for `SecretsManagerService` to use the Bitwarden secrets manager.

2. Set your preffered `fetchMode` and specify your `secretNames` if your preferred fetchMode is `STARTUP`.

3. After generating your application, Make sure to set your Bitwarden credentials in the `.env` file.
The required credentials include:
```env
    BITWARDEN_ACCESS_TOKEN=
    BITWARDEN_ORGANISATION_ID=
    BITWARDEN_API_URL=https://api.bitwarden.com
    BITWARDEN_IDENTITY_URL=https://identity.bitwarden.com
```


## Scripts

### `build`

Running `npm run build` will bundle your plugin with Webpack for production.

### `dev`

Running `npm run dev` will watch your plugin's source code and automatically bundle it with every change.



