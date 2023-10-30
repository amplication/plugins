import {
  AmplicationPlugin,
  CreateConnectMicroservicesParams,
  CreateEntityGrpcControllerBaseParams,
  CreateEntityGrpcControllerParams,
  CreateEntityGrpcControllerToManyRelationMethodsParams,
  CreateServerDotEnvParams,
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
  createGrpcControllerToManyRelationMethods,
  createGrpcProtoFile,
} from "./core";
import { merge } from "lodash";
import { envVariables } from "./constants";

class TransportGrpcPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      CreateServerDotEnv: {
        before: this.beforeCreateServerDotEnv,
      },
      CreateEntityGrpcControllerBase: {
        before: this.beforeCreateEntityGrpcControllerBase,
        after: this.afterCreateGrpcControllerBaseModules,
      },
      createEntityGrpcControllerToManyRelationMethods: {
        before: this.beforeCreateEntityGrpcControllerToManyRelationMethods,
      },

      CreateEntityGrpcController: {
        before: this.beforeCreateEntityGrpcController,
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
    const myValues = {
      dependencies: {
        "@grpc/grpc-js": "^1.9.3",
        "@grpc/proto-loader": "^0.7.10",
        "@nestjs/microservices": "^10.0.2",
      },
    };

    eventParams.updateProperties.forEach((updateProperty) =>
      merge(updateProperty, myValues)
    );

    return eventParams;
  }

  async beforeCreateEntityGrpcController(
    context: DsgContext,
    eventParams: CreateEntityGrpcControllerParams
  ) {
    await createGrpcController(context, eventParams);

    return eventParams;
  }

  async beforeCreateEntityGrpcControllerBase(
    context: DsgContext,
    eventParams: CreateEntityGrpcControllerBaseParams
  ) {
    await createGrpcControllerBase(context, eventParams);
    return eventParams;
  }

  async beforeCreateEntityGrpcControllerToManyRelationMethods(
    context: DsgContext,
    eventParams: CreateEntityGrpcControllerToManyRelationMethodsParams
  ) {
    await createGrpcControllerToManyRelationMethods(context, eventParams);
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

  async afterCreateGrpcControllerBaseModules(
    context: DsgContext,
    eventParams: CreateEntityGrpcControllerBaseParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const relatedEntities = eventParams.entity.fields.filter(
      (field) =>
        field.dataType === EnumDataType.Lookup &&
        field.properties?.allowMultipleSelection
    );

    // create proto file
    const protoFile = await createGrpcProtoFile(
      context,
      eventParams,
      relatedEntities
    );

    await modules.set(protoFile);

    return modules;
  }
}
export default TransportGrpcPlugin;
