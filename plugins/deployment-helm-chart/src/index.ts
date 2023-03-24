import type {
  AmplicationPlugin,
  CreateAdminUIParams,
  CreateServerParams,
  DsgContext,
  Events,
  Module,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { resolve } from "path";

/**
 * psuedo code to work-out:
 * 1. create directory on root of the repository:
 *      /<directory_setting_value>/<service_name>
 * 
 * 2. copy over the content of the 'chart' directory within the 
 *    static directory while replacing the content with a speciic
 *    keyword with the name of the service - i.e. example > server
 * 
 * 3. additonal kubernetes object next to default helm create objects:
 * 
 *      admin-ui:
 *      - config-map
 * 
 *      server:
 *      - configmap
 *      - secret
 */

class HelmChartPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServer]: {
        before: this.beforeCreateServer,
        after: this.afterCreateServer,
      },
      [EventNames.CreateAdminUI]: {
        before: this.beforeCreateAdminUI,
      },
    };
  }

  beforeCreateServer(context: DsgContext, eventParams: CreateServerParams) {
    // Here you can manipulate the context or save any context variable for your after function.
    // You can also manipulate the eventParams so it will change the result of Amplication function.
    // context.utils.skipDefaultBehavior = true; this will prevent the default behavior and skip our handler.

    return eventParams; // eventParams must return from before function. It will be used for the builder function.
  }

  async afterCreateServer(
    context: DsgContext,
    eventParams: CreateServerParams,
    modules: Module[]
  ) {
    // Here you can get the context, eventParams and the modules that Amplication created.
    // Then you can manipulate the modules, add new ones, or create your own.
    const staticPath = resolve(__dirname, "./static");
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.srcDirectory
    );

    return [...modules, ...staticsFiles]; // You must return the generated modules you want to generate at this part of the build.
  }

  beforeCreateAdminUI(context: DsgContext, eventParams: CreateAdminUIParams) {
    // Same as beforeCreateExample but for a different event.

    return eventParams;
  }
}

export default HelmChartPlugin;
