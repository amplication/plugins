import { Settings } from "../types"
import { join } from "path"

export default function getDevcontainerFolder(settings: Settings, serviceName: string) {
    if (settings.customLocation) {
        return settings.customLocation
    } 
    
    if (settings.generateBasedOnServiceName) {
        return join(".devcontainer", serviceName.replace(" ", "_"))
    }

    return ".devcontainer"
}
