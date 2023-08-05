import { CreateAdminUIPackageJsonParams, DsgContext } from "@amplication/code-gen-types";
import { adminUIPackageJsonValues } from "../constants";

export const beforeCreateClientPackageJson = async (
  context: DsgContext,
  eventParams: CreateAdminUIPackageJsonParams,
): Promise<CreateAdminUIPackageJsonParams> => {
  eventParams.updateProperties.push(adminUIPackageJsonValues)  

  return eventParams;
};