import {
  AmplicationPlugin,
  Events,
  EventNames,
} from "@amplication/code-gen-types";
import {
  afterCreateAppModule,
  afterCreateServerAuth,
  beforeCreateAppModule,
  beforeCreateEntityControllerModule,
  beforeCreateEntityControllerToManyRelationMethods,
  beforeCreateEntityModuleBase,
  beforeCreateEntityResolverToManyRelationMethods,
  beforeCreateEntityResolverToOneRelationMethods,
  beforeCreateResolverBaseModule,
  beforeCreateResolverModule,
  beforeCreateServer,
  beforeCreateServerDotEnv,
  beforeCreateServerPackageJson,
  beforeCreateControllerBaseModule,
  afterCreateServerPackageJson,
  beforeCreateEntityModule,
} from "./";

export abstract class AuthCorePlugin implements AmplicationPlugin {
  constructor(private readonly ignoredEvents?: Set<EventNames>) {}

  register(): Events {
    const events: Events = {
      CreateServerDotEnv: {
        before: beforeCreateServerDotEnv,
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
      CreateEntityResolverToManyRelationMethods: {
        before: beforeCreateEntityResolverToManyRelationMethods,
      },
      CreateEntityResolverToOneRelationMethods: {
        before: beforeCreateEntityResolverToOneRelationMethods,
      },
      CreateServer: {
        before: beforeCreateServer,
      },
    };
    if (!this.ignoredEvents) {
      return events;
    }

    // Remove ignored events
    return Object.entries(events).reduce((acc, [eventName, event]) => {
      if (this.ignoredEvents?.has(eventName as EventNames)) {
        return acc;
      }
      return {
        ...acc,
        [eventName]: event,
      };
    }, {} as Events);
  }
}
