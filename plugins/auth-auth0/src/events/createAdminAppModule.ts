import {
  CreateAdminAppModuleParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { readFile } from "@amplication/code-gen-utils";
import { templatesPath } from "../constants";
import { join } from "path";

export const beforeCreateAdminAppModule = async (
  context: DsgContext,
  eventParams: CreateAdminAppModuleParams
): Promise<CreateAdminAppModuleParams> => {
  const _appTemplate = await readFile(join(templatesPath, "App.template.tsx"));

  return {
    ...eventParams,
    template: _appTemplate,
  };
};
