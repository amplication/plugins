import {
  DsgContext,
  CreateServerDockerComposeParams,
} from "@amplication/code-gen-types";
import { updateDockerComposeProperties } from "../constants";

export function beforeCreateDockerComposeFile(
  dsgContext: DsgContext,
  eventParams: CreateServerDockerComposeParams,
): CreateServerDockerComposeParams {
  eventParams.updateProperties.push(...updateDockerComposeProperties);
  return eventParams;
}
