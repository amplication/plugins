import { EventNames, Events } from "@amplication/code-gen-types";
import { AuthCorePlugin } from "./auth-core-plugin";
import {
  afterCreateAppModule,
  afterCreateSeed,
  afterCreateServerAuth,
  afterCreateServerPackageJson,
  beforeCreateAppModule,
  beforeCreateControllerBaseModule,
  beforeCreateEntityControllerModule,
  beforeCreateEntityControllerToManyRelationMethods,
  beforeCreateEntityModule,
  beforeCreateEntityModuleBase,
  beforeCreateEntityResolverToManyRelationMethods,
  beforeCreateEntityResolverToOneRelationMethods,
  beforeCreateResolverBaseModule,
  beforeCreateResolverModule,
  beforeCreateSeed,
  beforeCreateServer,
  beforeCreateServerDotEnv,
  beforeCreateServerPackageJson,
} from "./";

class DummyPlugin extends AuthCorePlugin {
  override register(): Events {
    return super.register();
  }
}

class DummyPluginWithIgnoredEvents extends AuthCorePlugin {
  constructor() {
    const ignoredEvents = new Set([EventNames.CreateEntityModuleBase]);
    super(ignoredEvents);
  }

  override register(): Events {
    return super.register();
  }
}

describe("AuthCorePlugin", () => {
  it("should register events", () => {
    const plugin = new DummyPlugin();
    const events = plugin.register();
    expect(events).toEqual({
      CreateServerDotEnv: {
        before: beforeCreateServerDotEnv,
      },
      CreateEntityResolverToManyRelationMethods: {
        before: beforeCreateEntityResolverToManyRelationMethods,
      },
      CreateServerPackageJson: {
        before: beforeCreateServerPackageJson,
        after: afterCreateServerPackageJson,
      },
      CreateServerAppModule: {
        before: beforeCreateAppModule,
        after: afterCreateAppModule,
      },
      CreateServerAuth: {
        after: afterCreateServerAuth,
      },
      CreateEntityModuleBase: {
        before: beforeCreateEntityModuleBase,
      },
      CreateEntityModule: {
        before: beforeCreateEntityModule,
      },
      CreateEntityControllerBase: {
        before: beforeCreateControllerBaseModule,
      },
      CreateEntityController: {
        before: beforeCreateEntityControllerModule,
      },
      CreateEntityControllerToManyRelationMethods: {
        before: beforeCreateEntityControllerToManyRelationMethods,
      },
      CreateEntityResolver: {
        before: beforeCreateResolverModule,
      },
      CreateEntityResolverBase: {
        before: beforeCreateResolverBaseModule,
      },
      CreateEntityResolverToOneRelationMethods: {
        before: beforeCreateEntityResolverToOneRelationMethods,
      },
      CreateSeed: {
        before: beforeCreateSeed,
        after: afterCreateSeed,
      },
      CreateServer: {
        before: beforeCreateServer,
      },
    });
  });

  it("should ignore base events when register", () => {
    const plugin = new DummyPluginWithIgnoredEvents();
    const events = plugin.register();
    expect(events).toEqual({
      CreateServerDotEnv: {
        before: beforeCreateServerDotEnv,
      },
      CreateEntityResolverToManyRelationMethods: {
        before: beforeCreateEntityResolverToManyRelationMethods,
      },
      CreateServerPackageJson: {
        before: beforeCreateServerPackageJson,
        after: afterCreateServerPackageJson,
      },
      CreateServerAppModule: {
        before: beforeCreateAppModule,
        after: afterCreateAppModule,
      },
      CreateServerAuth: {
        after: afterCreateServerAuth,
      },
      CreateEntityModule: {
        before: beforeCreateEntityModule,
      },
      CreateEntityControllerBase: {
        before: beforeCreateControllerBaseModule,
      },
      CreateEntityController: {
        before: beforeCreateEntityControllerModule,
      },
      CreateEntityControllerToManyRelationMethods: {
        before: beforeCreateEntityControllerToManyRelationMethods,
      },
      CreateEntityResolver: {
        before: beforeCreateResolverModule,
      },
      CreateEntityResolverBase: {
        before: beforeCreateResolverBaseModule,
      },
      CreateEntityResolverToOneRelationMethods: {
        before: beforeCreateEntityResolverToOneRelationMethods,
      },
      CreateSeed: {
        before: beforeCreateSeed,
        after: afterCreateSeed,
      },
      CreateServer: {
        before: beforeCreateServer,
      },
    });
  });
});
