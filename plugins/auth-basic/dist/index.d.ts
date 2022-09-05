import { DsgContext, CreateAuthModulesParams, AmplicationPlugin, Events, CreateAdminModulesParams } from "@amplication/code-gen-types";
declare class BasicAuthPlugin implements AmplicationPlugin {
    static srcDir: string;
    register(): Events;
    beforeCreateAdminModules(context: DsgContext, eventParams: CreateAdminModulesParams["before"]): {};
    beforeCreateAuthModules(context: DsgContext, eventParams: CreateAuthModulesParams["before"]): {
        srcDir: string;
    };
    afterCreateAuthModules(context: DsgContext, eventParams: CreateAuthModulesParams["after"]): Promise<import("@amplication/code-gen-types").Module[]>;
}
export default BasicAuthPlugin;
