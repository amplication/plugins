import { CreateServerPackageJsonParams, DsgContext } from "@amplication/code-gen-types";
import { serverPackageJsonValues } from "../constants";

export const beforeCreateServerPackageJson = async (
  context: DsgContext,
  eventParams: CreateServerPackageJsonParams
): Promise<CreateServerPackageJsonParams> => {
  eventParams.updateProperties.push(serverPackageJsonValues);

  return eventParams;
};