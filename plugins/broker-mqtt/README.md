# @amplication/plugin-broker-mqtt

[![NPM Downloads](https://img.shields.io/npm/dt/@amplication/plugin-broker-mqtt)](https://www.npmjs.com/package/@amplication/plugin-broker-mqtt)

This is a plugin for Amplication that adds basic support for MQTT broker.

## Purpose

It saves the developers the mess of boilerplate a new microservice with integration to MQTT broker. Also it adds subscription to the broker and added topics automatically to the app. This is done using the [Amplication Message Broker Services](https://docs.amplication.com/how-to/create-message-broker/) and [NestJS MQTT](https://docs.nestjs.com/microservices/mqtt).

## Configuration

This plugin allows you to configure the MQTT broker settings. The following values can be provided in the plugin settings to configure the MQTT broker. 

>[!NOTE]
> These are optional settings and the plugin will work with default settings if not provided.

- `mqttBroker`: The name of the MQTT broker to be used. ( Optional, Default: `emqx`, Supported: `emqx`, `mosquitto`, `hivemq` and `hivemq-enterprise` )

- `mqttBrokerHost`: The host of the MQTT broker. ( Optional, Default: `localhost` )

- `mqttClientID`: The client ID to connect to the MQTT broker. ( Optional, Default: `broker-mqtt-(resourceID)` )

- `mqttPort`: The port of the MQTT broker. ( Optional, Default: `1883` )

- `mqttUsername`: The username to connect to the MQTT broker. ( Optional, Default: `admin` )

- `mqttPassword`: The password to connect to the MQTT broker. ( Optional, Default: `admin` )

- `mqttWsPort`: The port of the MQTT broker for WebSockets. This is used for the client or dashboard to connect to the broker. ( Optional, Default: `8073` )

- `mqttWebUiPort`: The port of the MQTT broker for the Web UI. This is where dashboard is served. ( Optional, Default: `8080` )

- `sparkplugConfig`: The configuration for the Sparkplug. This is used to configure the Sparkplug. 

  - `enabled`: Whether to enable the Sparkplug. ( Optional, Default: `false` )

  - `groupIdentifier`: The group identifier for the Sparkplug. ( Optional, Default: `amplication-sparkplug-group` )

  - `edgeNodeIdentifier`: The edge node identifier for the Sparkplug. ( Optional, Default: `amplication-sparkplug-edge` )

  - `clientIdentifier`: The client identifier for the Sparkplug. ( Optional, Default: `amplication-sparkplug-client-(resource-id)` )


## Supported MQTT Brokers

This plugin supports the following MQTT brokers:

- [EMQX](https://www.emqx.io/)
Has builtin dashboard and websockets support.

- [Mosquitto](https://mosquitto.org/)
Doesn't have builtin dashboard hence the webUI port is not used.

- [HiveMQ](https://www.hivemq.com/)

- [HiveMQ Enterprise](https://www.hivemq.com/products/mqtt-broker/)

## Scripts

### `build`

Running `npm run build` will bundle your plugin with Webpack for production.

### `dev`

Running `npm run dev` will watch your plugin's source code and automatically bundle it with every change.

### `test`

Running `npm run test` will run the tests for your plugin.
