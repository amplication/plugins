import {
  CreateServerPackageJsonParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { serverPackageJsonValues } from "../constants";
import { getPluginSettings } from "../utils";

export const beforeCreateServerPackageJson = (
  context: DsgContext,
  eventParams: CreateServerPackageJsonParams,
): CreateServerPackageJsonParams => {
  const { sparkplugConfig } = getPluginSettings(context.pluginInstallations);

  eventParams.updateProperties.push(serverPackageJsonValues);

  if (sparkplugConfig.enabled) {
    eventParams.updateProperties.push({
      dependencies: {
        "sparkplug-client": "^3.2.4",
      },
    });
  }

  return eventParams;
};
