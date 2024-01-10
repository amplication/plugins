# @amplication/plugin-devcontainer-github-codespaces

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-devcontainer-github-codespaces)](https://www.npmjs.com/package/@amplication/plugin-devcontainer-github-codespaces)

Quickly generates the configuration that you require to setup devcontainer for your Amplication App

## Purpose

Generates the configuration that you require to setup devcontainer for your Amplication App

## Configuration

This plugins allows you to customize the devcontainer config based:

- includeAdminUI (boolean): Start Admin UI alongside the server
- customLocation (string | null): Allows generating config as a specific directory.
- generateBasedOnServiceName (string): Generates the config based on the service name, i.e., at `<root>/.devcontainer/<service-name>/devcontainer.json`

>[

## Scripts

### `build`

Running `npm run build` will bundle your plugin with Webpack for production.

### `dev`

Running `npm run dev` will watch your plugin's source code and automatically bundle it with every change.

## Usage

Explain the usage of this plugin and its effect on the final build.
