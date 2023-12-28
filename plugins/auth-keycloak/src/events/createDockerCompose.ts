import {
  CreateServerDockerComposeDBParams,
  CreateServerDockerComposeParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { dockerComposeDevValues, dockerComposeProdValues } from "../constants";

export const beforeCreateServerDockerCompose = (
  context: DsgContext,
  eventParams: CreateServerDockerComposeParams,
): CreateServerDockerComposeParams => {
  eventParams.updateProperties.push(...dockerComposeProdValues);

  return eventParams;
};

export const beforeCreateServerDockerComposeDev = (
  context: DsgContext,
  eventParams: CreateServerDockerComposeDBParams,
): CreateServerDockerComposeDBParams => {
  eventParams.updateProperties.push(...dockerComposeDevValues);

  return eventParams;
};
