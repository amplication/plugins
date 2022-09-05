"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const models_1 = require("@amplication/code-gen-types/dist/models");
class BasicAuthPlugin {
    register() {
        return {
            createAdminModules: {
                before: this.beforeCreateAdminModules,
            },
            createAuthModules: {
                before: this.beforeCreateAuthModules,
                after: this.afterCreateAuthModules,
            }
        };
    }
    beforeCreateAdminModules(context, eventParams) {
        context.appInfo.settings.authProvider = models_1.EnumAuthProviderType.Http;
        return eventParams;
    }
    beforeCreateAuthModules(context, eventParams) {
        context.utils.skipDefaultBehavior = true;
        BasicAuthPlugin.srcDir = eventParams.srcDir;
        return eventParams;
    }
    async afterCreateAuthModules(context, eventParams) {
        const staticPath = (0, path_1.resolve)(__dirname, "../static");
        const staticsFiles = await context.utils.importStaticModules(staticPath, BasicAuthPlugin.srcDir);
        return staticsFiles;
    }
}
BasicAuthPlugin.srcDir = "";
exports.default = BasicAuthPlugin;
//# sourceMappingURL=index.js.map