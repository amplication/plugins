import { ModuleMap } from "@amplication/code-gen-types";

export function replacePlaceholdersInModuleMap(
  moduleMap: ModuleMap,
  templateReplacements: Record<string, string>,
  stringReplacements: Record<string, string>
): ModuleMap {
  moduleMap.modules().forEach((module) => {
    module.code = replacePlaceholders(module.code, templateReplacements);
    module.code = replaceText(module.code, stringReplacements);
  });

  return moduleMap;
}

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

export function replaceText(
  template: string,
  replacements: Record<string, string>
): string {
  return Object.entries(replacements).reduce((result, [key, value]) => {
    return result.replaceAll(key, value);
  }, template);
}
