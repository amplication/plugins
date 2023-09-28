import {
  AmplicationPlugin,
  CreateConnectMicroservicesParams,
  CreateEntityControllerBaseParams,
  CreateEntityControllerParams,
  CreateServerPackageJsonParams,
  DsgContext,
  EnumDataType,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import {
  connectGrpcMicroService,
  createGrpcClientOptionsFile,
  createGrpcController,
  createGrpcControllerBase,
} from "./core";
import { merge } from "lodash";

class JwtAuthPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      CreateEntityControllerBase: {
        after: this.afterCreateControllerBaseModules,
      },
      CreateEntityController: {
        after: this.afterCreateControllerModules,
      },
      CreateServerPackageJson: {
        before: this.beforeCreateServerPackageJson,
      },
      CreateConnectMicroservices: {
        before: this.beforeCreateConnectMicroservices,
        after: this.afterCreateConnectMicroservices,
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

  async beforeCreateConnectMicroservices(
    context: DsgContext,
    eventParams: CreateConnectMicroservicesParams
  ) {
    const { template } = eventParams;

    await connectGrpcMicroService(template);

    return eventParams;
  }
  async afterCreateConnectMicroservices(
    context: DsgContext,
    eventParams: CreateConnectMicroservicesParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const grpcClientOptions = await createGrpcClientOptionsFile(context);

    await modules.set(grpcClientOptions);

    return modules;
  }

  async afterCreateControllerBaseModules(
    context: DsgContext,
    eventParams: CreateEntityControllerBaseParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const relatedEntities = eventParams.entity.fields.filter(
      (field) =>
        field.dataType === EnumDataType.Lookup &&
        field.properties?.allowMultipleSelection
    );

    const controllerGrpcBase = await createGrpcControllerBase(
      context,
      eventParams,
      relatedEntities,
      modules
    );
    await modules.set(controllerGrpcBase);

    return modules;
  }

  async afterCreateControllerModules(
    context: DsgContext,
    eventParams: CreateEntityControllerParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const controllerGrpc = await createGrpcController(
      context,
      eventParams,
      modules
    );
    await modules.set(controllerGrpc);

    return modules;
  }
}

export default JwtAuthPlugin;
