import { CreateServerParams, DsgContext } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import AuthCorePlugin from "../index";
import exp from "constants";

describe("Testing beforeCreateServer hook", () => {
  let plugin: AuthCorePlugin;
  let params: CreateServerParams;

  beforeEach(() => {
    plugin = new AuthCorePlugin();
    params = mock<CreateServerParams>();
  });
  it("should throw exception when no auth entity is present", () => {
    const context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
      resourceInfo: { settings: {} },
      entities: [],
    });

    expect(() => plugin.beforeCreateServer(context, params)).toThrow(
      "Authentication entity does not exist",
    );
  });
  it("should throw exception when auth entity fields are missing in the auth entity", () => {
    const context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
      resourceInfo: { settings: { authEntityName: "User" } },
      entities: [{ name: "User", fields: [] }],
    });

    expect(() => plugin.beforeCreateServer(context, params)).toThrow(
      "Authentication entity does not have a field named roles",
    );
  });
});
