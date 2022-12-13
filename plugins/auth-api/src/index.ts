import {
  AmplicationPlugin,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  DsgContext,
  Events,
} from "@amplication/code-gen-types";
import { envVariables } from "./constants";
import { resolve } from "path";

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
      // CreateServerAuth: {
      //   before: this.beforeCreateAuthModules,
      //   after: this.afterCreateAuthModules,
      // },
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

  // beforeCreateAuthModules(
  //   context: DsgContext,
  //   eventParams: CreateServerAuthParams
  // ) {
  //   context.utils.skipDefaultBehavior = true;
  //   return eventParams;
  // }

  // async afterCreateAuthModules(
  //   context: DsgContext,
  //   eventParams: CreateServerAuthParams
  // ) {
  //   const staticPath = resolve(__dirname, "../static");
  //   const staticsFiles = await context.utils.importStaticModules(
  //     staticPath,
  //     context.serverDirectories.srcDirectory
  //   );

  //   return staticsFiles;
  // }
}

export default BasicAuthPlugin;
