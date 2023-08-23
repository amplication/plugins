import type {
  CreateAdminUIParams,
  DsgContext,
} from "@amplication/code-gen-types";
const beforeCreateAdminUI = (
  context: DsgContext,
  eventParams: CreateAdminUIParams
): CreateAdminUIParams => {
  // Same as beforeCreateExample but for a different event.

  return eventParams;
};

export { beforeCreateAdminUI };
