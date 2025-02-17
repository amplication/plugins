import {
  blueprintPluginEventsParams as blueprint,
  blueprintPluginEventsTypes,
  blueprintTypes,
} from "@amplication/code-gen-types";

import { pascalCase } from "pascal-case";
import { createModulesFiles } from "./create-modules/create-modules";
class netApiControllers implements blueprintTypes.AmplicationPlugin {
  register(): blueprintPluginEventsTypes.BlueprintEvents {
    return {
      createModule: {
        before: this.beforeCreateModule,
      },
    };
  }

  async beforeCreateModule(
    context: blueprintTypes.DsgContext,
    eventParams: blueprint.CreateModuleParams,
  ): Promise<blueprint.CreateModuleParams> {
    const { logger } = context;

    logger.info(`Creating module ${eventParams.moduleName}`);

    const serviceName = pascalCase(
      context.resourceInfo?.name || "Service Name",
    );

    const modulesFiles = await createModulesFiles(context, serviceName);

    for (const file of modulesFiles.getAll()) {
      context.files.set(file);
    }
    return eventParams;
  }
}

export default netApiControllers;
