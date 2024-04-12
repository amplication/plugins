import {
  CreateServerPackageJsonParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { serverPackageJsonValues } from "../constants";

export const beforeCreateServerPackageJson = (
  context: DsgContext,
  eventParams: CreateServerPackageJsonParams,
): CreateServerPackageJsonParams => {
  eventParams.updateProperties.push(serverPackageJsonValues);

  return eventParams;
};
