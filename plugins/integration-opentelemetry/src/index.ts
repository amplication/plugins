import type {
  AmplicationPlugin,
  Events,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { beforeCreateServerDockerCompose, beforeCreateServerDotEnv, beforeCreateServerPackageJson } from "./events";

class ESLintPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServerDockerCompose]: {
        before: beforeCreateServerDockerCompose
      },
      [EventNames.CreateServerDotEnv]: {
        before: beforeCreateServerDotEnv
      },
      [EventNames.CreateServerPackageJson]: {
        before: beforeCreateServerPackageJson
      },
    };
  }
}

export default ESLintPlugin;
