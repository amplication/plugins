export default function genDevcontainerConfig(serviceName: string, serverRoot: string) {
    return {
        "name": serviceName,
        "service": "server",
        "dockerComposeFile": [
            `../${serverRoot}/docker-compose.yml`
        ],
        "features": {
            "ghcr.io/devcontainers/features/docker-in-docker:2": {}
        },
        "initializeCommand": "bash .devcontainer/init.sh $(pwd)",
        "forwardPorts": [3000]
    }
}