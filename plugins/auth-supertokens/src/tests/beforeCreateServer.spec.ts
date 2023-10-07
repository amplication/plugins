import { CreateServerParams, DsgContext } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import SupertokensAuthPlugin from "../index";
import { name } from "../../package.json";

describe("Testing beforeCreateServer hook", () => {
    let plugin: SupertokensAuthPlugin;
    let context: DsgContext;
    let params: CreateServerParams;
    const authEntity = "AuthEntity";

    beforeEach(() => {
        plugin = new SupertokensAuthPlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{ npm: "@amplication/plugin-auth-core" }, { npm: name }],
            serverDirectories: {
                srcDirectory: ""
            },
            entities: [{
                name: authEntity,
                fields: [{ name: "email" }, { name: "password" }, { name: "username" }, { name: "hobbies" }]
            }],
            resourceInfo: {
                settings: {
                    authEntityName: authEntity
                }
            }
        });
        params = mock<CreateServerParams>()
    });
    it("should remove any email/password/username fields when the recipe is passwordless", () => {
        context.pluginInstallations[1].settings = {
            recipe: {
                name: "passwordless"
            }
        };
        plugin.beforeCreateServer(context, params);
        const authEntity = context.entities![0];
        expect(authEntity.fields.length).toStrictEqual(2);
        expect(authEntity.fields[0].name).toStrictEqual("hobbies");
    });
    it("should add the supertokens user ID field", () => {
        plugin.beforeCreateServer(context, params);
        const authEntityFields = context.entities![0].fields;
        const newEntityField = authEntityFields[authEntityFields.length - 1];
        expect(newEntityField.name).toStrictEqual("supertokensId");
        expect(newEntityField.required).toBe(true);
        expect(newEntityField.unique).toBe(true);
    });
});
