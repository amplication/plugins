import {
  BuildLogger,
  CreateServerAppModuleParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { readFile } from "@amplication/code-gen-utils";
import { mock } from "jest-mock-extended";
import { join } from "path";
import { builders } from "ast-types";
import { afterCreateServerAppModule } from "../events";
import { name } from "../../package.json";

describe("Test createServerAppModule", () => {
  let context: DsgContext;
  let eventParams: CreateServerAppModuleParams;
  let moduleMap: ModuleMap;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [
        {
          npm: name,
          pluginId: "storage-core",
        },
        {
          npm: "@amplication/plugin-storage-local",
          pluginId: "storage-local",
          enabled: true,
        },
        {
          npm: "@amplication/plugin-storage-s3",
          pluginId: "storage-s3",
          enabled: true,
        },
      ],
      serverDirectories: {
        srcDirectory: "/",
      },
      logger: mock<BuildLogger>(),
    });
    eventParams = mock<CreateServerAppModuleParams>();
    moduleMap = new ModuleMap(context.logger);
  });

  it("should return a valid app module", async () => {
    eventParams.template = await readFile(
      join(__dirname, "fixtures", "app.module.template.ts"),
    );

    eventParams.templateMapping = {
      MODULES: builders.arrayExpression([]),
    };

    const result = await afterCreateServerAppModule(
      context,
      eventParams,
      moduleMap,
    );

    expect(result.get("/storage/storage.module.ts")).toMatchSnapshot();
  });
});
