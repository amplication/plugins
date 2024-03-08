import {
  BuildLogger,
  CreateServerAppModuleParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { parse } from "@amplication/code-gen-utils";
import { mock } from "jest-mock-extended";
import { prettyPrint } from "recast";
import { name } from "../../package.json";
import { afterCreateAppModule } from "../index";

describe("Testing afterCreateServerAppModule hook", () => {
  let context: DsgContext;
  let params: CreateServerAppModuleParams;
  let modules: ModuleMap;

  beforeEach(() => {
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
    params = mock<CreateServerAppModuleParams>();
    modules = new ModuleMap(mock<BuildLogger>());
    modules.set({ code: "", path: "" });
  });
  it("should add the necessary auth module imports to the server app module", async () => {
    const newModules = await afterCreateAppModule(context, params, modules);
    const [appModule] = newModules.modules();
    const code = prettyCode(appModule.code);
    const expectedCode = prettyCode(correctOutput);
    expect(code).toStrictEqual(expectedCode);
  });
});

const correctOutput = `
import { ACLModule } from "./auth/acl.module";
import { AuthModule } from "./auth/auth.module";
`;

const prettyCode = (code: string) => prettyPrint(parse(code)).code;
