import { SecretsNameKey } from "@amplication/code-gen-types";

function getLastItem(str: string, substring: string): string {
  return str.split(substring).pop() ?? str;
}

export function secretNameParser(secretPath: string): Record<string, string> {
  const delimiter = secretPath.includes(":") ? ":" : "/";
  const secretName = getLastItem(secretPath, delimiter);

  return {
    [secretName]: secretPath,
  };
}

export function secretNamesParser(secretNames: string[]): SecretsNameKey[] {
  const secretsParsed: SecretsNameKey[] = [];

  secretNames.forEach((secretName) => {
    const [name, key] = Object.entries(secretNameParser(secretName))[0];

    secretsParsed.push({
      name,
      key,
    });
  });

  return secretsParsed;
}
