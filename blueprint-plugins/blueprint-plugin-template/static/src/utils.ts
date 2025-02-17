import { PluginInstallation } from "@amplication/code-gen-types";
import { Settings } from "./types";
import defaultSettings from "../.amplicationrc.json";
import { PLUGIN_ID } from "./constants";

export const getPluginSettings = (
  pluginInstallations: PluginInstallation[],
): Settings => {
  const plugin = pluginInstallations.find(
    (plugin) => plugin.pluginId === PLUGIN_ID,
  );

  const userSettings = plugin?.settings ?? {};

  const settings: Settings = {
    ...defaultSettings.settings,
    ...userSettings,
  };

  return settings;
};
