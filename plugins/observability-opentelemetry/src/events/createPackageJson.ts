import {
  CreateServerPackageJsonParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { packageJsonValues } from "@/constants";

export const beforeCreateServerPackageJson = (
  context: DsgContext,
  eventParams: CreateServerPackageJsonParams,
): CreateServerPackageJsonParams => {
  eventParams.updateProperties.push(packageJsonValues);

  return eventParams;
};
