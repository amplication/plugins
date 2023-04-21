# @amplication/plugin-broker-kafka

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-db-postgres)](https://www.npmjs.com/package/@amplication/plugin-kafka)

Implement Kafka as the message broker in your Amplication's generated services.

## Purpose

This plugin generates the relevant code to provide you with end-to-end integration for a Kafka message broker.

It generates the following parts:


- A topics list as a selectable enum.

- Kafka module and service with a base service as the plugin default behavior.

- A Kafka options getter function that extracts all the relevant variables from the `process.env` data.



## Usage

This plugin provides you with a ready configured NestJS module that you can use in your service. To customize the client options update the .env file with the relevant options.
