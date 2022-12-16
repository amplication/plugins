import {
  AmplicationPlugin,
  CreateEntityModuleBaseParams,
  CreateServerAuthParams,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  DsgContext,
  Events,
} from "@amplication/code-gen-types";
import { envVariables } from "./constants";
import { resolve } from "path";
import { namedTypes } from "ast-types";
import { parse } from "../util/ast";
import { readFile } from "../util/module";

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
      CreateServerAuth: {
        before: this.beforeCreateServerAuth,
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
    const entityModuleBaseTemplatePath = resolve(
      __dirname,
      "../template/entity-module/module.base.template.ts"
    );
    console.log(entityModuleBaseTemplatePath, "entityModuleBaseTemplatePath");

    eventParams.template = await readFile(entityModuleBaseTemplatePath);
    return eventParams;
  }

  async beforeCreateServerAuth(
    context: DsgContext,
    eventParams: CreateServerAuthParams
  ) {
    // 1. create user info
    // 2. create token payload interface
    // 3. create token service
    // 4. create token service test
  }
}

export default BasicAuthPlugin;
