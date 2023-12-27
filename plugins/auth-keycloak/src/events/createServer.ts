import { CreateServerParams, DsgContext } from "@amplication/code-gen-types";

export const beforeCreateServer = (
  context: DsgContext,
  eventParams: CreateServerParams
): CreateServerParams => {

  return eventParams;
};
