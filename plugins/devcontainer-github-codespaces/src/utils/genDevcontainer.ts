export const genDevcontainerConfig = (serviceName: string) => {
    return {
        "name": serviceName,
        "dockerComposeFile": "docker-compose.devcontainer.yml",
        "service": "devcontainer",
        "workspaceFolder": "/workspaces/${localWorkspaceFolderBasename}",
        "features": {
            "ghcr.io/devcontainers/features/docker-outside-of-docker:1": {
                "version": "latest",
                "enableNonRootDocker": "true",
                "moby": "true"
            },
            "ghcr.io/devcontainers/features/github-cli:1": {}
        },
        "forwardPorts": [3000]
    }
}

export const genDevcontainerConfigForAdminUI = (serviceName: string) => {
    const server = genDevcontainerConfig(serviceName)

    return {
        ...server,
        // Making the port public makes it accessible to the admin-ui; otherwise failing with CORS
        "postAttachCommand": "gh codespace ports visibility 3000:public -c $CODESPACE_NAME",
        "forwardPorts": [
            ...server.forwardPorts,
            3001,
        ],
    }
}