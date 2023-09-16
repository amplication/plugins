import type { AmplicationPlugin, Events } from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";

class ESLintPlugin implements AmplicationPlugin {
  register(): Events {
    return {
    };
  }
}

export default ESLintPlugin;
