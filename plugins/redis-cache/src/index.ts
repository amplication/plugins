import type {
  AmplicationPlugin,
  CreateServerPackageJsonParams,
  DsgContext,
  Events
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";


class RedisCachePlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServerPackageJson]: {
        before: this.beforeCreateServerPackageJson
      }
    };
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams
  ): CreateServerPackageJsonParams {
    return eventParams;
  }
}

export default RedisCachePlugin;
