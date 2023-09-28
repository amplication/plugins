import { ClientOptions, Transport } from "@nestjs/microservices";
import { join } from "path";

declare class PACKAGES_ARRAY {}
declare class PROTO_PATH_ARRAY {}

export const grpcClientOptions: ClientOptions = {
  transport: Transport.GRPC,
  options: {
    package: PACKAGES_ARRAY,
    protoPath: PROTO_PATH_ARRAY,
    url: "localhost:3001",
  },
};
