import { resolve } from "path";
import {
  DsgContext,
  AmplicationPlugin,
  Events,
  Module,
  EventNames,
  CreateServerParams,
  CreateAdminUIParams,
} from "@amplication/code-gen-types";


class ExamplePlugin implements AmplicationPlugin {
  /**
   * This is mandatory function that returns an object with the event name. Each event can have before or/and after
   */
  register(): Events {
    return {
    [EventNames.CreateServer]: {
      before: this.beforeCreateServer,
      after: this.afterCreateServer
    },
    [EventNames.CreateAdminUI]: {
      before: this.beforeCreateAdminUI
    }
    };
  }
  // You can combine many events in one plugin in order to change the related files.

  beforeCreateServer (
    context: DsgContext,
    eventParams: CreateServerParams
  ) {
    // Here you can manipulate the context or save any context variable for your after function.
    // You can also manipulate the eventParams so it will change the result of Amplication function
    // context.utils.skipDefaultBehavior = true; this will prevent the default behavior and skip our handler.

    return eventParams // eventParams must return from before function. It will be used for the builder function.
  }

  async afterCreateServer (
    context: DsgContext,
    eventParams: CreateServerParams,
    modules: Module[]
  ) {
    // Here you can get the context, eventParams and the modules Amplication created.
    // Then you can manipulate the modules, add new ones, or create your own.
    const staticPath = resolve(__dirname, "../static");
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.srcDirectory
    );

    return [ ...modules, ...staticsFiles]; // you must return the generated modules you want to generate at this part of the build
  }


  beforeCreateAdminUI (
    context: DsgContext,
    eventParams: CreateAdminUIParams
  ) {
    // same as beforeCreateExample but for a different event

    return eventParams
  }

}

export default ExamplePlugin;
