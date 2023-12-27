import { PluginInstallation } from "@amplication/code-gen-types";
import { name as PackageName } from "../package.json";
import { Settings } from "./types";
import defaultSettings from "../.amplicationrc.json";

export const getPluginSettings = (
  pluginInstallations: PluginInstallation[]
): Settings => {
  const plugin = pluginInstallations.find(
    (plugin) => plugin.npm === PackageName
  );

  const userSettings = plugin?.settings ?? {};

  const settings: Settings = {
    ...defaultSettings.settings,
    ...userSettings,
  };

  return settings;
};

export const getTerraformDirectory = (
  pluginInstallations: PluginInstallation[],
  serverBaseDirectory: string
): string => {
  const plugin = pluginInstallations.find(
    (plugin) =>
      plugin.npm === "@amplication/plugin-provisioning-terraform-aws-core"
  );

  if (!plugin) {
    throw new Error(
      "TerraformAwsDeploymentEcsPlugin: is dependent on 'Terraform - AWS Core' plugin"
    );
  }

  const { root_level, directory_name } = plugin.settings;

  if (root_level) {
    return `./${directory_name}`;
  } else {
    return `./${serverBaseDirectory}/${directory_name}`;
  }
};
