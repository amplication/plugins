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

export function replacePlaceholders(
  template: string,
  replacements: Record<string, string>
): string {
  return template.replace(/{{(.*?)}}/g, (match, key) => {
    // Return the replacement value if it exists (even if it's an empty string)
    // Otherwise, keep the placeholder
    return Object.prototype.hasOwnProperty.call(replacements, key.trim())
      ? replacements[key.trim()]
      : match;
  });
}
