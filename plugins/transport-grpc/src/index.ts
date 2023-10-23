import {
  AmplicationPlugin,
  CreateConnectMicroservicesParams,
  CreateEntityControllerBaseParams,
  CreateEntityControllerGrpcBaseParams,
  CreateEntityControllerGrpcParams,
  CreateEntityControllerGrpcToManyRelationMethodsParams,
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

class JwtAuthPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      CreateEntityControllerGrpcBase: {
        before: this.beforeCreateEntityControllerBaseGrpc,
        after: this.afterCreateControllerGrpcBaseModules
      },
      createEntityControllerGrpcToManyRelationMethods: {
        before: this.beforeCreateEntityGrpcControllerToManyRelationMethods,
      },

      CreateEntityControllerGrpc: {
        before: this.beforeCreateEntityControllerGrpc,
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

  async beforeCreateEntityControllerGrpc(
    context: DsgContext,
    eventParams: CreateEntityControllerGrpcParams
  ) {
    await createGrpcController(context, eventParams);

    return eventParams;
  }

  async beforeCreateEntityControllerBaseGrpc(
    context: DsgContext,
    eventParams: CreateEntityControllerGrpcBaseParams
  ) {
    await createGrpcControllerBase(context, eventParams);
    return eventParams;
  }

  async beforeCreateEntityGrpcControllerToManyRelationMethods(
    context: DsgContext,
    eventParams: CreateEntityControllerGrpcToManyRelationMethodsParams
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

  async afterCreateControllerGrpcBaseModules(
    context: DsgContext,
    eventParams: CreateEntityControllerGrpcBaseParams,
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

export default JwtAuthPlugin;
