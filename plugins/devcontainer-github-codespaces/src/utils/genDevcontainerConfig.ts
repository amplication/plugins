import path from "path"

export default function genDevcontainerConfig(serviceName: string, serverRoot: string, devcontainerPath: string) {
  const initSHPath = escapeSpace(`${path.dirname(devcontainerPath)}/init.sh`)

  return {
    "name": serviceName,
    "service": "server",
    "dockerComposeFile": [
      `../${serverRoot}/docker-compose.yml`
    ],
    "features": {
      "ghcr.io/devcontainers/features/docker-in-docker:2": {}
    },
    "initializeCommand": `bash ${initSHPath} $(pwd)`,
    "forwardPorts": [3000]
  }
}
