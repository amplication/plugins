import { name as PackageName } from "@root/package.json";
import defaultSettings from "@root/amplicationrc.json";
import { PluginInstallation } from "@amplication/code-gen-types";
import { Settings } from "@/types";

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
