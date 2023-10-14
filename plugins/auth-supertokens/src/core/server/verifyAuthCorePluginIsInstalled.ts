import { PluginInstallation } from "@amplication/code-gen-types";

export const verifyAuthCorePluginIsInstalled = (pluginInstallations: PluginInstallation[]) => {
    for(const plugin of pluginInstallations) {
        if(plugin.npm === "@amplication/plugin-auth-core") {
            return;
        }
    }
    throw new Error("The auth-core plugin must be installed for the auth-supertokens plugin to function");
}