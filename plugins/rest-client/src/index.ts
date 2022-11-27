import {
  AmplicationPlugin,
  CreateServerParams,
  DsgContext,
  EventNames,
  Events,
  Module,
} from "@amplication/code-gen-types";
import { join } from "path";
import { createSDK } from "./create-sdk";
import { createPackageJson } from "./package/create-package-json";
class ExamplePlugin implements AmplicationPlugin {
  /**
   * This is mandatory function that returns an object with the event name. Each event can have before or/and after
   */
  register(): Events {
    return {
      [EventNames.CreateServer]: {
        after: this.afterCreateServer,
      },
    };
  }

  async afterCreateServer(
    context: DsgContext,
    eventParams: CreateServerParams,
    modules: Module[]
  ) {
    const sdkPath = "sdk";
    const { entities } = context;
    if (!entities) {
      throw new Error("Entities are missing");
    }
    const sdkModules = await createSDK(join(sdkPath, "src"), entities);

    return [...modules, ...sdkModules];
  }
}

export default ExamplePlugin;
