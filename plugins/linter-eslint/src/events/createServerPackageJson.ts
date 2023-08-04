import { CreateServerPackageJsonParams, DsgContext } from "@amplication/code-gen-types";

export const beforeCreateServerPackageJson = async (
  context: DsgContext,
  eventParams: CreateServerPackageJsonParams
): Promise<CreateServerPackageJsonParams> => {
  return eventParams;
}