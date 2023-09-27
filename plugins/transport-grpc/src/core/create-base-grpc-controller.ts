import {
  Module,
  DsgContext,
  CreateEntityControllerBaseParams,
} from "@amplication/code-gen-types";
import { join } from "path";
import { templatesPath } from "../constants";
import { readFile, print } from "@amplication/code-gen-utils";
import { builders } from "ast-types";
import { interpolate, removeTSClassDeclares } from "../util/ast";

const baseGrpcControllerPath = join(
  templatesPath,
  "controller.grpc.base.template.ts"
);

export async function createGrpcControllerBase(
  dsgContext: DsgContext,
  eventParams: CreateEntityControllerBaseParams
): Promise<Module> {
  const { templateMapping, entityType, entityName } = eventParams;

  const template = await readFile(baseGrpcControllerPath);

  templateMapping["CONTROLLER_BASE"] = builders.identifier(
    `${entityType}ControllerGrpcBase`
  );
  interpolate(template, templateMapping);

  removeTSClassDeclares(template);

  const fileName = `${entityName.toLowerCase()}.controller.grpc.base.ts`;

  const filePath = `${
    dsgContext.serverDirectories
  }/${entityName.toLowerCase()}/base/${fileName}`;

  return {
    code: print(template).code,
    path: filePath,
  };
}
