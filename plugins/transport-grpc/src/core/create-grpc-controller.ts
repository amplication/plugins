import {
  CreateEntityControllerParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { readFile} from "@amplication/code-gen-utils";

import { join } from "path";
import { templatesPath } from "../constants";

const controllerGrpcPath = join(templatesPath, "controller.grpc.template.ts");


export async function createGrpcController(
  context: DsgContext,
  eventParams: CreateEntityControllerParams,
): Promise<void> {
  try {

    const controllerGrpcTemplate = await readFile(controllerGrpcPath);
  
    eventParams.template = controllerGrpcTemplate; 

  } catch (error) {
    console.error(error);
  }
}
