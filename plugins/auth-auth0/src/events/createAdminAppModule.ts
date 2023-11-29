import {
  CreateAdminAppModuleParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { readFile } from "@amplication/code-gen-utils";
import { templatesPath } from "../constants";
import { join } from "path";
import { EnumAuthProviderType } from "@amplication/code-gen-types/src/models";

export const beforeCreateAdminAppModule = async (
  context: DsgContext,
  eventParams: CreateAdminAppModuleParams
): Promise<CreateAdminAppModuleParams> => {
  const { resourceInfo } = context;
  if (resourceInfo) {
    resourceInfo.settings.authProvider = EnumAuthProviderType.Auth0;
  }

  const _appTemplate = await readFile(join(templatesPath, "App.template.tsx"));

  return {
    ...eventParams,
    template: _appTemplate,
  };
};
