import {
  AmplicationPlugin,
  CreateEntityModuleBaseParams,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  DsgContext,
  Events,
} from "@amplication/code-gen-types";
import { envVariables } from "./constants";
import { resolve } from "path";
import { namedTypes } from "ast-types";
import { parse } from "./util/ast";

class BasicAuthPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      CreateServerDotEnv: {
        before: this.beforeCreateServerDotEnv,
      },
      CreateServerPackageJson: {
        before: this.beforeCreateServerPackageJson,
        after: this.afterCreateServerPackageJson,
      },
      CreateEntityModuleBase: {
        before: this.beforeCreateEntityModuleBase,
      },
    };
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams
  ) {
    eventParams.envVariables = [...eventParams.envVariables, ...envVariables];

    return eventParams;
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams
  ) {
    context.utils.skipDefaultBehavior = true;
    return eventParams;
  }

  async afterCreateServerPackageJson(context: DsgContext) {
    const staticPath = resolve(__dirname, "../static/package-json");
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.baseDirectory
    );

    return staticsFiles;
  }

  async beforeCreateEntityModuleBase(
    context: DsgContext,
    eventParams: CreateEntityModuleBaseParams
  ) {
    const moduleBaseTemplatePath = resolve(
      __dirname,
      "../src/module"
    );

    const moduleFiles = await context.utils.importStaticModules(
      moduleBaseTemplatePath,
      context.serverDirectories.baseDirectory
    );

    const newTemplate = await parse(moduleFiles[0].code) as namedTypes.File;
    eventParams.template = newTemplate;
    return eventParams;
  }
}

export default BasicAuthPlugin;
