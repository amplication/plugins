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
import { readFile } from "@amplication/code-gen-utils";
import {
  createUserInfo,
  createTokenPayloadInterface,
  createAuthConstants,
  createTokenService,
  createTokenServiceTests,
} from "../core";

class AuthCorePlugin implements AmplicationPlugin {
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
        after: this.afterCreateServerAuth,
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
    const staticsFiles = await this.getStaticFiles(context, staticPath);

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

  async afterCreateServerAuth(context: DsgContext) {
    const staticPath = resolve(__dirname, "../static/auth");
    const staticsFiles = await this.getStaticFiles(context, staticPath);
    // 1. create user info
    const userInfo = await createUserInfo(context);
    // 2. create token payload interface
    const tokenPayloadInterface = await createTokenPayloadInterface(context);
    // 3. create constants for tests
    const athConstants = await createAuthConstants(context);
    // 4. create token service
    const tokenService = await createTokenService(context);
    // 5. create token service test
    const tokenServiceTest = await createTokenServiceTests(context);
    return [
      userInfo,
      tokenPayloadInterface,
      athConstants,
      tokenService,
      tokenServiceTest,
      ...staticsFiles,
    ];
  }

  private async getStaticFiles(context: DsgContext, staticPath: string) {
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.baseDirectory
    );

    return staticsFiles;
  }
}

export default AuthCorePlugin;
