import { DsgContext, CreateAuthModulesParams, AmplicationPlugin, Events, CreateAdminModulesParams } from "@amplication/code-gen-types";
declare class BasicAuthPlugin implements AmplicationPlugin {
    register(): Events;
    beforeCreateAdminModules(context: DsgContext, eventParams: CreateAdminModulesParams): CreateAdminModulesParams;
    beforeCreateAuthModules(context: DsgContext, eventParams: CreateAuthModulesParams): CreateAuthModulesParams;
    afterCreateAuthModules(context: DsgContext, eventParams: CreateAuthModulesParams): Promise<import("@amplication/code-gen-types").Module[]>;
}
export default BasicAuthPlugin;
