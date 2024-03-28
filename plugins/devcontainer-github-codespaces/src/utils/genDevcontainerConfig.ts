import path from "path"
import countParents from "./countParents"

export default function genDevcontainerConfig(serviceName: string, serverRoot: string, devcontainerPath: string) {
  const initSHPath = `${path.dirname(devcontainerPath)}/init.sh`
  const parents = countParents(devcontainerPath)

  return {
    "name": serviceName,
    "service": "server",
    "dockerComposeFile": [
      `${"../".repeat(parents)}${serverRoot}/docker-compose.yml`
    ],
    "features": {
      "ghcr.io/devcontainers/features/docker-in-docker:2": {}
    },
    "initializeCommand": `bash ${initSHPath} $(pwd)`,
    "forwardPorts": [3000]
  }
}
