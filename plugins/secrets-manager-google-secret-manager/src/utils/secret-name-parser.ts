import { SecretsNameKey } from "@amplication/code-gen-types";

export function secretNameParser(secretPath: string): Record<string, string> {
    const secretName = secretPath.split(":").shift() ?? secretPath;

    return {
        [secretName]: secretPath,
    };
}

export function secretNamesParser(secretNames: string[]): SecretsNameKey[] {
    var secretsParsed: SecretsNameKey[] = [];

    secretNames.forEach((secretName) => {
        const [name, key] = Object.entries(secretNameParser(secretName))[0];

        secretsParsed.push({
            name,
            key,
        });
    });

    return secretsParsed;
}
