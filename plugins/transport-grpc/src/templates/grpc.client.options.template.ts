import { ClientOptions, Transport } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";

declare class PACKAGES_ARRAY {}
declare class PROTO_PATH_ARRAY {}

let configService: ConfigService = new ConfigService();

export const grpcClientOptions: ClientOptions = {
  transport: Transport.GRPC,
  options: {
    package: PACKAGES_ARRAY,
    protoPath: PROTO_PATH_ARRAY,
    url: configService.get<string>("GRPC_CLIENT_URL_PATH"),
  },
};
