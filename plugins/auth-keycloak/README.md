# @amplication/plugin-auth-keycloak

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-auth-keycloak)](https://www.npmjs.com/package/@amplication/plugin-auth-keycloak)

Enable [KeyCloak](https://www.keycloak.org/) authentication on a service

## Purpose

This plugin adds the required code to use Passport Keycloak strategy on the generated NestJS application
[**Keycloak**](https://www.keycloak.org/) is an authentication and authorization platform that provides the required tools to secure your applications and services.

## Configuration
This plugin requires the following settings during plugin configuration:
- `KEYCLOAK_HOST`:   Complete URL of keycloak instance,
- `KEYCLOAK_REALM`:   Name of the realm to be used for authentication (or the one you just created)
- `KEYCLOAK_CLIENT_ID`:   Client ID of the client to be used for authentication (or the client we just created)
- `KEYCLOAK_CLIENT_SECRET`:   Client Secret of the client to be used for authentication.
- `KEYCLOAK_CALLBACK_URL`:   Callback URL to be used (http://localhost:3001/auth-callback)


## Example :-
```json
{
  "settings": {
    "KEYCLOAK_HOST": "localhost",
    "KEYCLOAK_REALM": "test-realm",
    "KEYCLOAK_CLIENT_ID": "test-client",
    "KEYCLOAK_CLIENT_SECRET": "pryUAZxDplBlJmRfCZ8yxH2NT1Dcad5H",
    "KEYCLOAK_CALLBACK_URL": "http://localhost:3000/api/callback"
  }
}
```

## Working with the plugin

It can be used by adding the plugin in the `plugins` page of the app settings. The plugin can be added by providing the settings as shown in the [Configuration](#configuration) section. Once it is run, you can [setup the KeyCloak Realm](#setting_up_keycloak) using plugin cofiguration

Results in configuring the app to use keycloak for authentication. It adds the necessary dependencies, creates a Keycloak strategy and adds the required environment variables in the `.env` file.

> **Note:** Keycloak stores user data in a separate db. You will have to add this step in user-creation flow.


## Setting up Keycloak

### Create a new Keycloak Realm
Note: this assumes keycloak server is running in `docker container` and is accessible at `localhost:8180`

* Go to [Admin panel](http://localhost:8180/admin/master/console/) and Login using default creds:
  Username: admin and Password: password
* Go to [Create Realm](http://localhost:8180/admin/master/console/#/master/add-realm) and Create a new Realm.
* Select the newly created Realm and Goto Create Client. Add required information.
  - Set Home URL to: http://localhost:8180/auth (or configure it as per keycloak installation)
    The Application will redirect user to this url for authentication.
  - Set Valid URIs to: http://localhost:3001/auth-callback
    This will re-direct users to this URI after successful login.
  - Set Valid post logout redirect URIs to: http://localhost:3001/login
    This will re-direct users to this URI after successful logout.


## Scripts

### `build`

Running `npm run build` will bundle your plugin with Webpack for production.

### `dev`

Running `npm run dev` will watch your plugin's source code and automatically bundle it with every change.
