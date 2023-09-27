import {
  AmplicationPlugin,
  CreateEntityControllerBaseParams,
  CreateServerPackageJsonParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { createGrpcControllerBase } from "./core";
import { merge } from "lodash";

class JwtAuthPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      CreateEntityControllerBase: {
        after: this.afterCreateControllerBaseModules,
      },
      CreateServerPackageJson: {
        before: this.beforeCreateServerPackageJson,
      },
    };
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams
  ) {
    const myValues = {
      dependencies: {
        "@grpc/grpc-js": "^1.9.3",
        "@grpc/proto-loader": "^0.7.10",
        "@nestjs/microservices": "^9.3.9",
      },
    };

    eventParams.updateProperties.forEach((updateProperty) =>
      merge(updateProperty, myValues)
    );

    return eventParams;
  }

  async afterCreateControllerBaseModules(
    context: DsgContext,
    eventParams: CreateEntityControllerBaseParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const controllerGrpcBase = await createGrpcControllerBase(
      context,
      eventParams
    );
    await modules.set(controllerGrpcBase);

    return modules;
  }
}

export default JwtAuthPlugin;
