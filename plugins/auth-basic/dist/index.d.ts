import { AmplicationPlugin, CreateAdminUIParams, CreateServerAuthParams, DsgContext, Events } from "@amplication/code-gen-types";
declare class BasicAuthPlugin implements AmplicationPlugin {
    register(): Events;
    beforeCreateAdminModules(context: DsgContext, eventParams: CreateAdminUIParams): CreateAdminUIParams;
    beforeCreateAuthModules(context: DsgContext, eventParams: CreateServerAuthParams): CreateServerAuthParams;
    afterCreateAuthModules(context: DsgContext, eventParams: CreateServerAuthParams): Promise<import("@amplication/code-gen-types").Module[]>;
}
export default BasicAuthPlugin;
