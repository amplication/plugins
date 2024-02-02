import { join } from "path";

export const staticsPath = join(__dirname, "static");
export const templatesPath = join(__dirname, "templates");

const DOCKER_SERVICE_MQTT_NAME = "mqtt-broker";

export const serverPackageJsonValues = {
  dependencies: {
    "@nestjs/microservices": "^10.3.1",
    mqtt: "^5.3.5",
  },
};

export const hiveMqDockerCompose = {
  services: {
    [DOCKER_SERVICE_MQTT_NAME]: {
      image: "hivemq/hivemq4:latest",
      ports: [
        "${MQTT_PORT}:1883",
        "${MQTT_WS_PORT}:8000",
        "${MQTT_WEB_UI_PORT}:8080",
      ],
      healthcheck: {
        test: ["CMD", "echo", '""', ">", "/dev/tcp/127.0.0.1/1883"],
        interval: "5s",
        timeout: "5s",
        retries: 10,
      },
    },
  },
};

export const hivemqCommunityDockerCompose = {
  services: {
    [DOCKER_SERVICE_MQTT_NAME]: {
      image: "hivemq/hivemq-ce:latest",
      ports: ["${MQTT_PORT}:1883", "${MQTT_WS_PORT}:8000"],
      healthcheck: {
        test: ["CMD", "echo", '""', ">", "/dev/tcp/127.0.0.1/1883"],
        interval: "5s",
        timeout: "5s",
        retries: 10,
      },
    },
  },
};

export const mosquittoDockerCompose = {
  services: {
    [DOCKER_SERVICE_MQTT_NAME]: {
      image: "eclipse-mosquitto:1.6",
      ports: ["${MQTT_PORT}:1883", "${MQTT_WS_PORT}:8000"],
      environment: {
        MQTT_USER: "${MQTT_USERNAME}",
        MQTT_PASSWORD: "${MQTT_PASSWORD}",
      },
      healthcheck: {
        test: ["CMD", "echo", '""', ">", "/dev/tcp/127.0.0.1/1883"],
        interval: "5s",
        timeout: "5s",
        retries: 10,
      },
    },
  },
};

export const emqxDockerCompose = {
  services: {
    [DOCKER_SERVICE_MQTT_NAME]: {
      image: "emqx:5.4.0",
      ports: [
        "${MQTT_PORT}:1883",
        "${MQTT_WS_PORT}:8083",
        "${MQTT_WEB_UI_PORT}:18083",
      ],
      healthcheck: {
        test: ["CMD", "/opt/emqx/bin/emqx", "ctl", "status"],
        interval: "5s",
        timeout: "25s",
        retries: 5,
      },
    },
  },
};
