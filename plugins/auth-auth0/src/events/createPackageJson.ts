import {
  CreateAdminUIPackageJsonParams,
  CreateServerPackageJsonParams,
  DsgContext,
} from "@amplication/code-gen-types";
import {
  adminUIPackageJsonValues,
  serverPackageJsonValues,
} from "../constants";

export const beforeCreatePackageJson = (event: "server" | "client") => {
  return async (
    context: DsgContext,
    eventParams: CreateAdminUIPackageJsonParams | CreateServerPackageJsonParams,
  ): Promise<
    CreateAdminUIPackageJsonParams | CreateServerPackageJsonParams
  > => {
    let packageJsonValues;

    switch (event) {
      case "server":
        packageJsonValues = serverPackageJsonValues;
        break;
      case "client":
        packageJsonValues = adminUIPackageJsonValues;
        break;
    }

    eventParams.updateProperties.push(packageJsonValues);
    return eventParams;
  };
};
