function getLastItem(str: string, substring: string): string {
    return str.split(substring).pop() ?? str
}

export function secretNameParser(secretPath: string): Record<string, string> {
    const delimiter = secretPath.includes(":") ? ":" : "/"
    const secretName = getLastItem(secretPath, delimiter)
    
    return {
        [secretName]: secretPath
    }
}

export function secretNamesParser(secretNames: string[]): Record<string, string> {
    var secretsParsed = {}

    secretNames.forEach((secretName) => {
        secretsParsed = { ...secretsParsed, ...secretNameParser(secretName) }
    })

    return secretsParsed
}