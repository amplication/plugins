import { CreateServerParams, DsgContext, ModuleMap } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { prettyCode } from "../utils"
import SupertokensAuthPlugin, { checks } from "../index";
import { name } from "../../package.json";

describe("Testing afterCreateServer hook", () => {
    let plugin: SupertokensAuthPlugin;
    let context: DsgContext;
    let params: CreateServerParams;
    let moduleMap: ModuleMap;

    beforeEach(() => {
        plugin = new SupertokensAuthPlugin();
        context = mock<DsgContext>({
            pluginInstallations: [{ npm: name }],
            serverDirectories: {
                srcDirectory: ""
            },
            resourceInfo: {
                settings: {
                    serverSettings: {
                        generateGraphQL: false
                    }
                }
            }
        });
        params = mock<CreateServerParams>()
        moduleMap = new ModuleMap(context.logger);
        moduleMap.set({
            path: "main.ts",
            code: prettyCode(beforeRemovingCorsSetting)
        });
        checks.addedAuthModuleInAuthDir = true;
        checks.replacedEntityController = true;
        checks.replacedEntityControllerBase = true;
        checks.replacedEntityResolver = true;
        checks.replacedEntityResolverBase = true;
    });
    it("should remove the default cors settings", async () => {
        const modules = await plugin.afterCreateServer(context, params, moduleMap);
        let expectedCode = prettyCode(afterRemoveCorsSetting);
        const code = prettyCode(modules.get("main.ts").code);
        expect(code).toStrictEqual(expectedCode);
    });
});

const beforeRemovingCorsSetting = `import { connectMicroservices } from "./connectMicroservices";

const { PORT = 3000 } = process.env;

async function main() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.setGlobalPrefix("api");
}
`;

const afterRemoveCorsSetting = `import { connectMicroservices } from "./connectMicroservices";

const { PORT = 3000 } = process.env;

async function main() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
}

`;
