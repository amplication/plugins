import { CreateAdminUIPackageJsonParams, CreateServerPackageJsonParams, DsgContext } from "@amplication/code-gen-types";
import { adminUIPackageJsonValues, serverPackageJsonValues } from "../constants";
import { getPluginSettings } from "../utils";

export const beforeCreatePackageJson = (
  event: "server" | "client",
) => {
  return async (
  context: DsgContext,
  eventParams: CreateAdminUIPackageJsonParams | CreateServerPackageJsonParams,
  ): Promise<CreateAdminUIPackageJsonParams | CreateServerPackageJsonParams> => {
    let packageJsonValues;

    const { formatter } = getPluginSettings(
      context.pluginInstallations,
    );

    switch (event) {
      case "server":
        packageJsonValues = serverPackageJsonValues;
        break;
      case "client":
        packageJsonValues = adminUIPackageJsonValues;
        break;
    }

    if(formatter === "prettier") {
      packageJsonValues.devDependencies = {
        ...packageJsonValues.devDependencies,
        "eslint-config-prettier": "^8.3.0",
      };
    }

    eventParams.updateProperties.push(packageJsonValues);  
    return eventParams;
  };
};