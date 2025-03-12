import { PluginInstallation } from "@amplication/code-gen-types";

import defaultSettings from "../.amplicationrc.json";
import { name as PackageName } from "../package.json";
import { Settings } from "./types";
export const getPluginSettings = (
  pluginInstallations: PluginInstallation[],
): Settings => {
  const plugin = pluginInstallations.find(
    (plugin) => plugin.npm === PackageName,
  );

  const userSettings = plugin?.settings ?? {};

  const settings: Settings = {
    ...defaultSettings.settings,
    ...userSettings,
  };

  return settings;
};
