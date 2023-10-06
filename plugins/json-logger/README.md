# @amplication/plugin-<name>json-logger

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-json-loger)](https://www.npmjs.com/package/@amplication/plugin-json-logger)

## Description

The Amplication Plugin - JSON Logger is a plugin for [Amplication](https://amplication.com/) that enables JSON-format logging with customizable log levels and additional log properties. This plugin allows you to configure log settings and adds a JSON logger service to your generated Amplication services.

## Purpose

The purpose of this plugin is to provide developers with an easy way to enable JSON-format logging in Amplication-generated services. It allows you to configure various logging options, including log levels and additional log properties, providing greater flexibility and control over the logging process.


## Configuration

To configure this plugin, you can modify the `.amplicationrc.json` file in your Amplication project. The following settings are available:

- `logLevel`: Set the desired log level (e.g., "INFO", "WARN", "ERROR"). The default is "INFO".
- `additionalLogProperties`: Define additional log properties as key-value pairs.


## Scripts

### `build`

Running `npm run build` will bundle your plugin with Webpack for production.

### `dev`

Running `npm run dev` will watch your plugin's source code and automatically bundle it with every change.

## Usage

To use this plugin, follow these steps:

1. Install the plugin package using npm or yarn:

```bash
npm install @amplication/plugin-json-logger
# or
yarn add @amplication/plugin-json-logger
