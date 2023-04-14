# @amplication/plugin-deployment-helm-chart

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-deployment-helm-chart)](https://www.npmjs.com/package/@amplication/plugin-deployment-helm-chart)

Adds a helm chart for the generated service which can be used for deployment of the application within a Kubernetes cluster.

## Purpose

Adds a helm chart for the generated service which can be used for deployment of the application within a Kubernetes cluster.

## Configuration

```json
{
    "root_level" : "true",
    "directory_name" : "helm",
    "server" : {
        "chart_version" : "0.0.1",
        "application_version" : "0.0.1",
        "repository" : "ghcr.io/NAMESPACE/IMAGE_NAME",
        "tag" : "latest",
        "hostname" : "server.example.com",
        "configuration" : {
            "PORT" : "3000",
            "COMPOSE_PROJECT_NAME" : "amp_00000000000000",
            "JWT_EXPIRATION" : "2d",
            "BCRYPT_SALT" : "10"
        },
        "secrets" : {
            "DB_URL" : "postgres://username:password@localhost:5432/db-name",
            "DB_PORT" : "5432",
            "DB_USER" : "username",
            "DB_PASSWORD" : "password",
            "JWT_SECRET" : "change_me"
        }
    },
    "admin_ui" : {
        "chart_version" : "0.0.1",
        "application_version" : "0.0.1",
        "repository" : "ghcr.io/NAMESPACE/IMAGE_NAME",
        "tag" : "latest",
        "hostname" : "admin.example.com",
        "configuration" : {
            "PORT" : "3001",
            "REACT_APP_SERVER_URL" : "http://localhost:3000"
        },
    }
}
```


## Usage

Explain the usage of this plugin and its effect on the final build.

## Scripts

### `build`

Running `npm run build` will bundle your plugin with Webpack for production.

### `dev`

Running `npm run dev` will watch your plugin's source code and automatically bundle it with every change.