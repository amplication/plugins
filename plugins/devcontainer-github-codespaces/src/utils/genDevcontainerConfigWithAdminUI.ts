import genDevcontainerConfig from "./genDevcontainerConfig"
import countParents from "./countParents"

export default function genDevcontainerConfigWithAdminUI(serviceName: string, serverRoot: string, clientRoot: string, devcontainerPath: string) {
    const serverConfig = genDevcontainerConfig(serviceName, serverRoot, devcontainerPath)
    const parents = countParents(devcontainerPath)

    return {
        ...serverConfig,
        dockerComposeFile: [
            ...serverConfig.dockerComposeFile,
            `${"../".repeat(parents)}${clientRoot}/docker-compose.yml`,
        ],
        forwardPorts: [...serverConfig.forwardPorts, 3001]
    }
}