import genDevcontainerConfig from "./genDevcontainerConfig"

export default function genDevcontainerConfigWithAdminUI(serviceName: string, serverRoot: string, clientRoot: string, devcontainerPath: string) {
    const serverConfig = genDevcontainerConfig(serviceName, serverRoot, devcontainerPath)

    return {
        ...serverConfig,
        dockerComposeFile: [
            ...serverConfig.dockerComposeFile,
            `../${clientRoot}/docker-compose.yml`,
        ],
        forwardPorts: [...serverConfig.forwardPorts, 3001]
    }
}