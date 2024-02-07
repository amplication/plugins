import {
  CreateServerDockerComposeDevParams,
  CreateServerDockerComposeParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { getPluginSettings } from "../utils";
import {
  DOCKER_SERVICE_MQTT_NAME,
  emqxDockerCompose,
  hiveMqDockerCompose,
  hivemqCommunityDockerCompose,
  mosquittoDockerCompose,
} from "../constants";

export const beforeCreateDockerComposeFile = (type: "PROD" | "DEV") => {
  return (
    context: DsgContext,
    eventParams:
      | CreateServerDockerComposeDevParams
      | CreateServerDockerComposeParams,
  ) => {
    const { updateProperties } = eventParams;
    const settings = getPluginSettings(context.pluginInstallations);

    switch (settings.mqttBroker) {
      case "hivemq":
        updateProperties.push(hivemqCommunityDockerCompose);
        break;
      case "mosquitto":
        updateProperties.push(mosquittoDockerCompose);
        break;
      case "hivemq-enterprise":
        updateProperties.push(hiveMqDockerCompose);
        break;
      case "emqx":
        updateProperties.push(emqxDockerCompose);
        break;
    }

    if (type === "PROD") {
      updateProperties.push({
        services: {
          migrate: {
            depends_on: {
              [DOCKER_SERVICE_MQTT_NAME]: {
                condition: "service_healthy",
              },
            },
          },
        },
      });
    }

    return eventParams;
  };
};
