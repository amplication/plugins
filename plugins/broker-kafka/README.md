# @amplication/plugin-broker-kafka

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-db-postgres)](https://www.npmjs.com/package/@amplication/plugin-kafka)

Implement Kafka as the message broker in your Amplication's generated services.

## Purpose

This plugin generates the relevant code to provide you with end-to-end integration for a Kafka message broker.

It generates the following parts:

- A topics list as a selectable enum.

- Kafka module and service that contains an emit function to send messages to a Kafka queue.

- Kafka controller with an endpoint listener for each topic connected to the service, and their type is “receive."

- A Kafka options getter function that extracts all the relevant variables from the nestjs common ConfigService (by default if would load the available environment variables)

## Usage

This plugin provides you with a ready configured NestJS module that you can use in your service. To customize the client options update the .env file with the relevant options.
