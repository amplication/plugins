import type { AmplicationPlugin, Events } from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";

class TransportHttpsPlugin implements AmplicationPlugin {
  register(): Events {
    return {};
  }
}

export default TransportHttpsPlugin;
