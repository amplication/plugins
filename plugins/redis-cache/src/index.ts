import type {
  AmplicationPlugin,
  CreateServerPackageJsonParams,
  DsgContext,
  Events
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { merge, update } from "lodash"


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
    const redisDeps = {
      dependencies: {
        "cache-manager": "3.6.3",
        "cache-manager-redis-store": "2.0.0",
        "@types/cache-manager": "3.4.3",
        "@types/cache-manager-redis-store": "2.0.1"
      }
    }

    eventParams.updateProperties.forEach((updateProperty) => {
      merge(updateProperty, redisDeps);
    });

    return eventParams;
  }
}

export default RedisCachePlugin;
