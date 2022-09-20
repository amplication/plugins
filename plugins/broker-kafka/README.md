# @amplication/plugin-kafka

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-db-postgres)](https://www.npmjs.com/package/@amplication/plugin-kafka)

Use this plugin to implement a kafka as the message broker in your Amplication's generated services.

## Purpose

This plugin generate the relevant code to provide you an end to end integration for a kafka message broker
It generates the following parts:

- A topics list as a selectable enum
- Kafka module and service with a base service as the plugin default behaver.
- A kafka options getter function that extract all the relevant variables from the `process.env` data

## Usage

This plugin provide you a already configured NestJS module that you can use in your service, to customize the client options just update the .env file with the relevant options.
