import type { AmplicationPlugin, Events } from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import {
  afterLoadStaticFiles,
  beforeCreateServerAppModule,
  beforeCreateServerDockerCompose,
  beforeCreateServerDotEnv,
  beforeCreateServerPackageJson,
} from "@/events";

class ESLintPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServerAppModule]: {
        before: beforeCreateServerAppModule,
      },
      [EventNames.CreateServerDockerCompose]: {
        before: beforeCreateServerDockerCompose,
      },
      [EventNames.CreateServerDockerComposeDB]: {
        before: beforeCreateServerDockerCompose,
      },
      [EventNames.CreateServerDotEnv]: {
        before: beforeCreateServerDotEnv,
      },
      [EventNames.CreateServerPackageJson]: {
        before: beforeCreateServerPackageJson,
      },
      [EventNames.LoadStaticFiles]: {
        after: afterLoadStaticFiles,
      },
    };
  }
}

export default ESLintPlugin;
