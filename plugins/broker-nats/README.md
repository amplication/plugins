# @amplication/plugin-broker-nats

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-broker-nats)](https://www.npmjs.com/package/@amplication/plugin-broker-nats)

This plugin provide basic integration with NATS servers

## Purpose

This plugin saves the developers the mess of boilerplate a new microservice with integration to NATS server.

## Instructions

To make sure that the `@amplicaiton/broker-nats` package will work currectly you as a developer needs to make sure you'r service is booting up with micro-service support in the `bootstrap` function in the main.ts [(This is called an hybrid app)](https://github.com/nestjs/docs.nestjs.com/blob/master/content/faq/hybrid-application.md).

The two most important function to call are the `app.connectMicroservice` with a NATS transport and the `app.startAllMicroservices` function.

Another important thing is to make sure that the `NatsModule` is called from the `app.module.ts`

## Scripts

### `build`

Running `npm run build` will bundle your plugin with Webpack for production.

### `dev`

Running `npm run dev` will watch your plugin's source code and automatically bundle it with every change.
