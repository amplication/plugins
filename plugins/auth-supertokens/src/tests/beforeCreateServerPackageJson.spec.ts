import { DsgContext } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import SupertokensAuthPlugin from "../index";


describe("Testing beforeServerPackageJson hook", () => {
    let plugin: SupertokensAuthPlugin;
    let context: DsgContext;
    beforeEach(() => {
        plugin = new SupertokensAuthPlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{ npm: name }]
        });
    });
    it("should add the dependencies required to use Supertokens to the package.json file", () => {
        const { updateProperties } = plugin.beforeCreateServerPackageJson(context, {
            fileContent: "",
            updateProperties: [{}]
        })
        expect(updateProperties).toStrictEqual([{
            dependencies: {
                "supertokens-node": "15.1.0"
            }
        }]);
    });
});
