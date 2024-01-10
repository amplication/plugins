import { Settings } from "../types"
import { join } from "path"

export default function genPathBasedOnConfig(settings: Settings, serviceName: string): string {
    if (settings.customLocation) return join(settings.customLocation, "devcontainer.json")

    if (settings.generateBasedOnServiceName) {
        return join(".devcontainer", serviceName, "devcontainer.json")
    }

    return join(".devcontainer", "devcontainer.json")
}
