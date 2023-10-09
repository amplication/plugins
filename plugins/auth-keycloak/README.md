# @amplication/plugin-auth-keycloak

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-auth-keycloak)](https://www.npmjs.com/package/@amplication/plugin-auth-keycloak)

Enable [KeyCloak](https://www.keycloak.org/) authentication on a service

## Purpose

This plugin adds the required code to use Passport Keycloak strategy on the generated NestJS application
[**Keycloak**](https://www.keycloak.org/) is an authentication and authorization platform that provides the required tools to secure your applications and services.

## Prerequisites

- 


## Configuration

```json
{
  "settings": {
    "KC_HOST": "",
    "KC_REALM": "",
    "KC_CLIENT_ID": "",
    "KC_CLIENT_SECRET": "",
    "KC_CALLBACK_URL: "",
  }
}
```


## Scripts

### `build`

Running `npm run build` will bundle your plugin with Webpack for production.

### `dev`

Running `npm run dev` will watch your plugin's source code and automatically bundle it with every change.

## Usage

Explain the usage of this plugin and its effect on the final build.



## Working with the plugin

It can be used by adding the plugin in the `plugins` page of the app settings. The plugin can be added by providing the settings as shown in the [Configuration](#configuration) section.

> **Note:** Have to add the [auth-core-plugin](../auth-auth0/README.md) plugin before adding this plugin.
Results in configuring the app to use auth0 for authentication. It adds the necessary dependencies, creates a JWT strategy and adds the required environment variables in the `.env` file.

