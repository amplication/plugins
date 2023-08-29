import {
  CreateServerDockerComposeParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { dockerComposeValues } from "@/constants";

export const beforeCreateServerDockerCompose = (
  context: DsgContext,
  eventParams: CreateServerDockerComposeParams
): CreateServerDockerComposeParams => {
  eventParams.updateProperties.push(...dockerComposeValues);
  return eventParams;
};
