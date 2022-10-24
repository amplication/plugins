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
   * this is mandatory function that return object with events name. each event can have before or/and after
   */
  register(): Events {
    return {
    [EventNames.CreateServer]: {
      before: this.beforeCreateExample,
      after: this.afterCreateExample
    },
    [EventNames.CreateAdminUI]: {
      before: this.beforeCreateAdminExample
    }
    };
  }
  // you can combine many events in one plugin in order to change the related files.

  beforeCreateExample (
    context: DsgContext,
    eventParams: CreateServerParams
  ) {
    // here you can manipulate the context or save any context variable for your after function
    // you can also manipulate the eventParams so it will change the result of Amplication function
    // context.utils.skipDefaultBehavior = true; this will prevent the default behavior and skip our handler.

    return eventParams // eventParams must return from before function. it will be use for the builder function.
  }

  afterCreateExample (
    context: DsgContext,
    eventParams: CreateServerParams,
    modules: Module[]
  ) {
    // here you can get the context, eventParams and the modules Amplication created
    // then you can manipulate the modules or add new ones or create your own.

    return modules; // you must return the generated modules you want to generate at this part of the build
  }


  beforeCreateAdminExample (
    context: DsgContext,
    eventParams: CreateAdminUIParams
  ) {
    // same as beforeCreateExample but for a different event

    return eventParams
  }

}

export default ExamplePlugin;
