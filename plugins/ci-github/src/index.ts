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
import { forEach } from "lodash";

class ExamplePlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServerPackageJson]: {
        before: () => ({
          updateProperties: [
            {
              scripts: {
                "test": "echo \"No tests available\"",
                "lint:check": "echo \"No linting available\"",
                "format:check": "echo \"No formatting available\"",
              }
            },
          ],
        }),
      },
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

    // Remove files
    modules = modules.filter((module) => module.path !== "server/Dockerfile");
    modules = modules.filter((module) => module.path !== "server/.dockerignore");

    // Copy all static files to the server's base folder
    const baseStaticFilesPath = resolve(__dirname, "./static/base");

    console.log('dir', context.serverDirectories.baseDirectory);

    const baseStaticFiles = await context.utils.importStaticModules(
      baseStaticFilesPath,
      `server`
    );

    // Override values in the github actions file
    const appInfo = ((context as any).appInfo);
    const kebabCaseAppName = appInfo.name.toLowerCase().replace(/ /g, '-');

    const ciWorkflowModule = baseStaticFiles.find((module) => module.path === "server/.github/workflows/ci.yaml");
    ciWorkflowModule!.code = ciWorkflowModule!.code.replace("${DOCKER_IMAGE_TAG}", kebabCaseAppName);

    let allModules = [...modules, ...baseStaticFiles];

    allModules = allModules.map((module) => {
      module.path = module.path.replace("server/", "");
      return module;
    });

    // Return all modules
    return [...allModules]; // You must return the generated modules you want to generate at this part of the build.
  }

  beforeCreateAdminUI(context: DsgContext, eventParams: CreateAdminUIParams) {
    // Same as beforeCreateExample but for a different event.
    return eventParams;
  }
}

export default ExamplePlugin;
