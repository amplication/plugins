import {
  AmplicationPlugin,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { resolve } from "path";
import { dependencies, envVariables } from "./constants";

class IntegrationOpenaiPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      CreateServer: {
        after: this.afterCreateServer,
      },
      CreateServerPackageJson: {
        before: this.beforeCreateServerPackageJson,
      },
      CreateServerDotEnv: {
        before: this.beforeCreateServerDotEnv,
      },
    };
  }

  //adds the openai dependency to the package.json file
  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams
  ) {
    eventParams.updateProperties.push(dependencies);

    return eventParams;
  }

  //adds the openai api key to the .env file
  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams
  ) {
    eventParams.envVariables = [...eventParams.envVariables, ...envVariables];

    return eventParams;
  }

  //adds the openai module and service to the "providers" folder
  async afterCreateServer(
    context: DsgContext,
    eventParams: CreateServerParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const staticPath = resolve(__dirname, "./static");
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.srcDirectory
    );

    await modules.merge(staticsFiles);
    return modules;
  }
}

export default IntegrationOpenaiPlugin;
