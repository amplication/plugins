import { CreateAdminUIPackageJsonParams, DsgContext } from "@amplication/code-gen-types";

export const beforeCreateClientPackageJson = async (
  context: DsgContext,
  eventParams: CreateAdminUIPackageJsonParams,
): Promise<CreateAdminUIPackageJsonParams> => {
  

  return eventParams;
}