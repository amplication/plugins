import {
  AmplicationPlugin,
  CreateServerAuthParams,
  CreateServerPackageJsonParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { EventNames } from "@amplication/code-gen-types";
import { resolve, join } from "path";
import { readFile, print } from "@amplication/code-gen-utils";
import { merge } from "lodash";
import * as constants from "./constants";

class SupertokensAuthPlugin implements AmplicationPlugin {
  
  register(): Events {
    return {
      [EventNames.CreateServerAuth]: {
        after: this.afterCreateServerAuth
      },
      [EventNames.CreateServerPackageJson]: {
        before: this.beforeCreateServerPackageJson
      }
    };
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams
  ): CreateServerPackageJsonParams {
    const supertokensDeps = constants.dependencies

    eventParams.updateProperties.forEach((updateProperty) => {
      merge(updateProperty, supertokensDeps);
    });

    return eventParams;
  }

  async afterCreateServerAuth(
    context: DsgContext,
    eventParams: CreateServerAuthParams
  ): Promise<ModuleMap> {
    const { serverDirectories, logger } = context;
    const fileNames = [
      "supertokens/supertokens.service.ts",
      "supertokens/supertokens.service.spec.ts",
      "auth.filter.ts",
      "auth.filter.spec.ts",
      "auth.guard.ts",
      "auth.guard.spec.ts",
      "auth.middleware.ts",
      "auth.middleware.spec.ts",
      "auth.module.ts",
      "config.interface.ts",
      "generateSupertokensOptions.ts",
      "recipes.ts",
      "session.decorator.ts"
    ];

    const modules = new ModuleMap(logger);
    for(const name of fileNames) {
      const filePath = resolve(constants.staticsPath, name);
      const file = await readFile(filePath);
      await modules.set({
        code: print(file).code,
        path: join(serverDirectories.authDirectory, name)
      });
    }

    return modules;
  }
}

export default SupertokensAuthPlugin;
