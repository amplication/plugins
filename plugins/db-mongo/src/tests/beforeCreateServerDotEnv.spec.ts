import { DsgContext } from "@amplication/code-gen-types";
import { deepEqual } from "assert";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import PostgresPlugin from "../index";

describe("Testing beforeCreateServerDotEnv hook", () => {
  let plugin: PostgresPlugin;
  let context: DsgContext;
  beforeEach(() => {
    plugin = new PostgresPlugin();
    context = mock<DsgContext>({
      pluginInstallations: [{ npm: name }],
    });
  });
  it("should use the default settings if plugin settings are not exists", () => {
    const { envVariables } = plugin.beforeCreateServerDotEnv(context, {
      envVariables: [],
    });

    deepEqual(envVariables, [
      { DB_USER: "admin" },
      { DB_PASSWORD: "admin" },
      { DB_PORT: 27017 },
      {
        DB_URL: "mongodb://admin:admin@localhost:27017/my-db?authSource=admin",
      },
    ]);
  });

  it("should use the plugin settings if exists", () => {
    const newPort = 80;
    context.pluginInstallations[0].settings = { port: newPort };
    const { envVariables } = plugin.beforeCreateServerDotEnv(context, {
      envVariables: [],
    });

    deepEqual(envVariables, [
      { DB_USER: "admin" },
      { DB_PASSWORD: "admin" },
      { DB_PORT: newPort },
      {
        DB_URL: `mongodb://admin:admin@localhost:${newPort}/my-db?authSource=admin`,
      },
    ]);
  });
});
