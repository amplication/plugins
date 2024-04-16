function stripTrailingSlashes(str: string): string {
    return str.replace(/\/$/, "")
}

function relative(folder: string): string {
    const sub_count = stripTrailingSlashes(folder).split("/").length;

    return "../".repeat(sub_count)
}

export const genDevcontainerDockerComposeForServer = (devcontainerFolder: string, serverFolder: string) => {
    return {
        include: [`${relative(devcontainerFolder)}${serverFolder}/docker-compose.yml`],
        version: "3",
        services: {
            devcontainer: {
                image: "mcr.microsoft.com/devcontainers/base:debian",
                command: "sleep infinity",
                links: ["server"]
            }
        }
    }
}

export const genDevcontainerDockerComposeForServerAndAdminUI = (devcontainerFolder: string, serverDir: string, adminDir: string) => {
    const server = genDevcontainerDockerComposeForServer(devcontainerFolder, serverDir);

    return {
        ...server,
        include: [
            ...server.include,
            `${relative(devcontainerFolder)}${stripTrailingSlashes(adminDir)}/docker-compose.devcontainer.yml`
        ],
        services: {
            devcontainer: {
                ...server.services.devcontainer,
                links: [
                    ...server.services.devcontainer.links,
                    "admin-ui"
                ],
            },
        }
    }
}
