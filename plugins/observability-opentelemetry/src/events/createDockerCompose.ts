import {
  CreateServerDockerComposeDBParams,
  CreateServerDockerComposeParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { dockerComposeDevValues, dockerComposeValues } from "@/constants";

export const beforeCreateServerDockerCompose = (
  context: DsgContext,
  eventParams: CreateServerDockerComposeParams
): CreateServerDockerComposeParams => {
  eventParams.updateProperties.push(...dockerComposeValues);

  return eventParams;
};

export const beforeCreateServerDockerComposeDev = (
  context: DsgContext,
  eventParams: CreateServerDockerComposeDBParams
): CreateServerDockerComposeDBParams => {
  eventParams.updateProperties.push(...dockerComposeDevValues);

  return eventParams;
};
