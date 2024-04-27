import {
  CreateServerAppModuleParams,
  DsgContext,
  ModuleMap,
  PluginInstallation,
} from "@amplication/code-gen-types";
import { builders } from "ast-types";
import { join, resolve } from "path";
import { templatesPath } from "../constants";
import { print, readFile } from "@amplication/code-gen-utils";
import { pascalCase } from "pascal-case";
import { addImports, importNames, interpolate } from "../util/ast";

const prepareStorageModuleTemplate = async (
  pluginInstallations: PluginInstallation[],
) => {
  const storageModuleTemplatePath = resolve(
    templatesPath,
    "storage.module.template.ts",
  );

  const storageModuleTemplate = await readFile(storageModuleTemplatePath);

  // Gets name of the storage plugins that are enabled ( for this to work the plugins must have the storage prefix)
  const fileUploadPlugins = pluginInstallations
    .filter(
      (plugin) =>
        plugin.pluginId.includes("storage") &&
        plugin.enabled &&
        plugin.pluginId !== "storage-core",
    )
    .map((plugin) => plugin.pluginId.replace("storage", ""));

  // local -> LocalStorageService, s3 -> S3StorageService
  const storageServices = fileUploadPlugins.map((plugin) => {
    return builders.identifier(`${pascalCase(plugin)}StorageService`);
  });

  const templateMapping = {
    PROVIDERS_ARRAY: builders.arrayExpression(storageServices),
  };

  interpolate(storageModuleTemplate, templateMapping);

  // import { LocalStorageService } from './providers/local/local.storage.service';
  const importArray = fileUploadPlugins.map((service) =>
    importNames(
      [builders.identifier(`${pascalCase(service)}StorageService`)],
      `./providers/${service}/${service}.storage.service`,
    ),
  );

  addImports(storageModuleTemplate, importArray);

  return storageModuleTemplate;
};

export const beforeCreateServerAppModule = async (
  context: DsgContext,
  eventParams: CreateServerAppModuleParams,
) => {
  const { templateMapping, modulesFiles } = eventParams;
  const { pluginInstallations } = context;
  const moduleFile = await prepareStorageModuleTemplate(pluginInstallations);

  const storageModuleId = builders.identifier("StorageModule");

  const importArray = builders.arrayExpression([
    storageModuleId,
    ...eventParams.templateMapping["MODULES"].elements,
  ]);

  templateMapping["MODULES"] = importArray;

  const importFile = {
    code: print(moduleFile).code,
    path: join(
      context.serverDirectories.srcDirectory,
      "storage",
      "storage.module.ts",
    ),
  };

  modulesFiles.set(importFile);

  return eventParams;
};

export const afterCreateServerAppModule = async (
  context: DsgContext,
  eventParams: CreateServerAppModuleParams,
  modules: ModuleMap,
) => {
  const { pluginInstallations } = context;
  const storageModule = await prepareStorageModuleTemplate(pluginInstallations);

  const storageModuleFile = {
    code: print(storageModule).code,
    path: join(
      context.serverDirectories.srcDirectory,
      "storage",
      "storage.module.ts",
    ),
  };

  await modules.set(storageModuleFile);

  return modules;
};
