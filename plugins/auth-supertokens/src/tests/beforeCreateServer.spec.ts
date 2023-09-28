import { CreateServerParams, DsgContext, ModuleMap } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { parse } from "@amplication/code-gen-utils";
import { builders } from "ast-types"
import * as recast from "recast"
import { prettyCode } from "../utils"
import SupertokensAuthPlugin from "../index";
import { print } from "@amplication/code-gen-utils";
import { name } from "../../package.json";

describe("Testing beforeCreateServer hook", () => {
    let plugin: SupertokensAuthPlugin;
    let context: DsgContext;
    let params: CreateServerParams;
    const authEntity = "AuthEntity";

    beforeEach(() => {
        plugin = new SupertokensAuthPlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{ npm: name }],
            serverDirectories: {
                srcDirectory: ""
            },
            entities: [{
                name: authEntity,
                fields: []
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
        expect(context.entities![0].fields.length).toStrictEqual(1);
        const newEntity = context.entities![0].fields[0];
        expect(newEntity.name).toStrictEqual("supertokensId");
        expect(newEntity.required).toBe(true);
        expect(newEntity.unique).toBe(true);
    });
});
