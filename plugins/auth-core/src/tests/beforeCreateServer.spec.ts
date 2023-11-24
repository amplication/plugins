import { CreateServerParams, DsgContext } from "@amplication/code-gen-types";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import AuthCorePlugin from "../index";

describe("Testing beforeCreateServer hook", () => {
  let plugin: AuthCorePlugin;
  let params: CreateServerParams;

  beforeEach(() => {
    plugin = new AuthCorePlugin();
    params = mock<CreateServerParams>();
  });
  it("should add the auth entity when none is present", () => {
    const context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
      resourceInfo: { settings: {} },
      entities: [],
    });

    plugin.beforeCreateServer(context, params);

    expect(context.entities!.length).toStrictEqual(1);
    const newEntity = context.entities![0];
    expect(newEntity.name).toStrictEqual("User");
  });
  it("should add necessary auth entity fields when their missing in the auth entity", () => {
    const context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
      resourceInfo: { settings: { authEntityName: "User" } },
      entities: [{ name: "User", fields: [] }],
    });

    plugin.beforeCreateServer(context, params);

    expect(context.entities!.length).toStrictEqual(1);
    const authEntity = context.entities![0];
    expect(authEntity.fields.length).toStrictEqual(3);
    for (const fieldname of ["username", "password", "roles"]) {
      try {
        expect(
          authEntity.fields.find((field) => field.name === fieldname),
        ).toBeTruthy();
      } catch (err) {
        throw new Error(`The plugin did not add the ${fieldname} field`);
      }
    }
  });
});
