import * as common from "@nestjs/common";
import * as swagger from "@nestjs/swagger";

declare interface SERVICE {}

declare const RESOURCE: string;

declare class CONTROLLER_GRPC_BASE {
  protected readonly service: SERVICE;
  constructor(service: SERVICE);
}

@swagger.ApiTags(RESOURCE)
@common.Controller(RESOURCE)
export class CONTROLLER_GRPC extends CONTROLLER_GRPC_BASE {
  constructor(protected readonly service: SERVICE) {
    super(service);
  }
}
