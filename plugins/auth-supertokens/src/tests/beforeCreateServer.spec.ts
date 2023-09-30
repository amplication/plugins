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
            pluginInstallations: [{ npm: name }, { npm: "@amplication/plugin-auth-core" }],
            serverDirectories: {
                srcDirectory: ""
            },
            entities: [{
                name: authEntity,
                fields: [{ name: "email" }, { name: "password" }]
            }],
            resourceInfo: {
                settings: {
                    authEntityName: authEntity
                }
            }
        });
        params = mock<CreateServerParams>()
    });
    it("should add the supertokens user ID field", () => {
        plugin.beforeCreateServer(context, params);
        expect(context.entities![0].fields.length).toStrictEqual(3);
        const newEntityField = context.entities![0].fields[2];
        expect(newEntityField.name).toStrictEqual("supertokensId");
        expect(newEntityField.required).toBe(true);
        expect(newEntityField.unique).toBe(true);
    });
});
