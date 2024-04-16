import {
  CreateServerDotEnvParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { envVariables } from "../constants";

export function beforeCreateServerDotEnv(
  context: DsgContext,
  eventParams: CreateServerDotEnvParams
) {
  eventParams.envVariables = [...eventParams.envVariables, ...envVariables];

  return eventParams;
}
