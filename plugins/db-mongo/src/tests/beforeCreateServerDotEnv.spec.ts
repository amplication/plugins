import { DsgContext } from "@amplication/code-gen-types";
import { deepEqual } from "assert";
import { mock } from "jest-mock-extended";
import { name } from "../../package.json";
import MongoPlugin from "../index";

describe("Testing beforeCreateServerDotEnv hook", () => {
  let plugin: MongoPlugin;
  let context: DsgContext;
  beforeEach(() => {
    plugin = new MongoPlugin();
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
      { DB_PORT: (27017).toString() },
      { DB_NAME: "my-db" },
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
      { DB_PORT: newPort.toString() },
      { DB_NAME: "my-db" },
      {
        DB_URL: `mongodb://admin:admin@localhost:${newPort}/my-db?authSource=admin`,
      },
    ]);
  });
});
