import { DsgContext } from "@amplication/code-gen-types";
import { deepEqual } from "assert";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import RedisCachePlugin from "../index";


describe("Testing beforeServerPackageJson hook", () => {
    let plugin: RedisCachePlugin;
    let context: DsgContext;
    beforeEach(() => {
        plugin = new RedisCachePlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{ npm: name }]
        });
    });
    it("should add the dependencies required to use Redis to the package.json file", () => {
        const { updateProperties } = plugin.beforeCreateServerPackageJson(context, {
            fileContent: "",
            updateProperties: [{}]
        })
        deepEqual(updateProperties, [{
            dependencies: {
                "cache-manager": "3.6.3",
                "cache-manager-redis-store": "2.0.0"
            },
            devDependencies: {
                "@types/cache-manager": "3.4.3",
                "@types/cache-manager-redis-store": "2.0.1"
            }
        }]);
    });
});
