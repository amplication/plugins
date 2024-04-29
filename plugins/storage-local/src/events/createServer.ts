import {
  CreateServerParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { join, resolve } from "path";
import { templatesPath } from "../constants";
import { print, readFile } from "@amplication/code-gen-utils";
import { getPluginSettings } from "../utils";
import { interpolate } from "../util/ast";
import { builders } from "ast-types";

export const beforeCreateServer = async (context: DsgContext) => {
  const { pluginInstallations } = context;
  if (
    !pluginInstallations.some(
      (plugin) => plugin.npm === "@amplication/plugin-storage-core",
    )
  ) {
    throw new Error(
      "The storage-core plugin must be installed for the storage-local plugin to function",
    );
  }
};

export const afterCreateServer = async (
  context: DsgContext,
  eventParams: CreateServerParams,
  modules: ModuleMap,
) => {
  const { fileBasePath } = getPluginSettings(context.pluginInstallations);

  const providerServicePath = resolve(
    templatesPath,
    "local.storage.service.template.ts",
  );
  const providerService = await readFile(providerServicePath);

  const templateMapping = {
    BASE_PATH: builders.stringLiteral(fileBasePath || "uploads"),
  };

  interpolate(providerService, templateMapping);

  const providerTypesPath = resolve(
    templatesPath,
    "local.storage.types.template.ts",
  );

  const providerTypes = await readFile(providerTypesPath);

  await modules.set({
    code: print(providerService).code,
    path: join(
      context.serverDirectories.srcDirectory,
      "storage",
      "providers",
      "local",
      "local.storage.service.ts",
    ),
  });

  await modules.set({
    code: print(providerTypes).code,
    path: join(
      context.serverDirectories.srcDirectory,
      "storage",
      "providers",
      "local",
      "local.storage.types.ts",
    ),
  });

  return modules;
};
