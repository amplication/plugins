import type { AmplicationPlugin, Events } from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import {
  afterLoadStaticFiles,
  beforeCreateServerAppModule,
  beforeCreateServerDockerCompose,
  beforeCreateServerDockerComposeDev,
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
      [EventNames.CreateServerDockerComposeDev]: {
        before: beforeCreateServerDockerComposeDev,
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
