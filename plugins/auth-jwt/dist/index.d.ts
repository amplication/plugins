import { DsgContext, CreateServerAuthParams, AmplicationPlugin, Events, CreateAdminUIParams } from "@amplication/code-gen-types";
declare class JwtAuthPlugin implements AmplicationPlugin {
    register(): Events;
    beforeCreateAdminModules(context: DsgContext, eventParams: CreateAdminUIParams): CreateAdminUIParams;
    beforeCreateAuthModules(context: DsgContext, eventParams: CreateServerAuthParams): CreateServerAuthParams;
    afterCreateAuthModules(context: DsgContext, eventParams: CreateServerAuthParams): Promise<any>;
}
export default JwtAuthPlugin;
