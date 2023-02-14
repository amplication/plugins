import { join, resolve } from "path";
import {
  CreateEntityControllerBaseParams,
  DsgContext,
  Module
} from "@amplication/code-gen-types";
import { readFile } from "@amplication/code-gen-utils";

const controllerTemplatePath = join(
  resolve(__dirname, "./templates"),
  "controller.template.ts"
);

export const beforeCreateEntityControllerBase = async (
  context: DsgContext,
  eventParams: CreateEntityControllerBaseParams
) => {
  const template = await readFile(controllerTemplatePath);

  return {...eventParams, template};
}

export const afterCreateEntityControllerBase = (
  context: DsgContext,
  eventParams: CreateEntityControllerBaseParams,
  modules: Module[]
) => {
  try {
    const modulePath = `server/src/web-server/${eventParams.entityName}.controller.ts`;
    modules[0].path = modulePath

    return modules;
  } catch (error) {
    console.log(error);
    return modules;
  }
  return modules
}