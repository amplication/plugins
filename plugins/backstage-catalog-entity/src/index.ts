import type {
  AmplicationPlugin,
  CreateServerParams,
  DsgContext,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import {
  metadataNameKey,
  metadataDescriptionKey,
  metadataLabelsKey,
  metadataAnnotationsKey,
  metadataTagsKey,
  specLifecycleKey,
  specOwnerKey,
  specTypeKey,
  defaultNamePrefix,
  defaultDescription,
  defaultLabels,
  defaultAnnotations,
  defaultTags,
  defaultLifecycle,
  defaultOwner,
} from "./constants";
import { kebabCase } from "lodash";
import { resolve } from "path";
import { EventNames } from "@amplication/code-gen-types";
import { getPluginSettings } from "./utils";

const pluginDescription = "Backstage Catalog Entity file";

class BackstageCatalogEntityPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      [EventNames.CreateServer]: {
        after: this.afterCreateServer,
      },
    };
  }

  async afterCreateServer(
    context: DsgContext,
    eventParams: CreateServerParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    context.logger.info(`Generating ${pluginDescription}...`);

    const serviceName = kebabCase(context.resourceInfo?.name);
    const serviceDescription = context.resourceInfo?.description;
    const serviceType = context.resourceType.toLowerCase();

    const settings = getPluginSettings(context.pluginInstallations);

    const staticPath = resolve(__dirname, "./static/");
    const staticFiles = await context.utils.importStaticModules(
      staticPath,
      "."
    );

    const templateFileName = "template.yaml";
    const destinationFileName = "catalog-info.yaml";

    staticFiles.replaceModulesPath((path) =>
      path.replace(templateFileName, destinationFileName)
    );

    let labels = "";
    let annotations = "";
    let tags = "";

    const indentation = "    ";

    const name = settings.prefix_name
      ? `${settings.prefix_name}-${serviceName}`
      : `${defaultNamePrefix}-${serviceName}`;

    const description = serviceDescription ?? defaultDescription;

    const l = settings.labels ?? defaultLabels;

    l.forEach((value, name) => {
      labels = `${labels}\n${indentation}${name}: "${value}"`;
    });

    const a = settings.annotations ?? defaultAnnotations;

    a.forEach((value, name) => {
      annotations = `${annotations}\n${indentation}${name}: "${value}"`;
    });

    const t = settings.tags ?? defaultTags;

    t.forEach((tag) => {
      tags = `${tags}\n${indentation}- "${tag}"`;
    });

    const type = settings.spec?.type ?? serviceType;
    const lifecycle = settings.spec?.life_cycle ?? defaultLifecycle;
    const owner = settings.spec?.owner ?? defaultOwner;

    staticFiles.replaceModulesCode((_path, code) =>
      code
        .replace(metadataNameKey, name)
        .replace(metadataDescriptionKey, description)
        .replace(metadataLabelsKey, labels)
        .replace(metadataAnnotationsKey, annotations)
        .replace(metadataTagsKey, tags)
        .replace(specTypeKey, type)
        .replace(specLifecycleKey, lifecycle)
        .replace(specOwnerKey, owner)
    );

    context.logger.info(`Generated ${pluginDescription}...`);
    return modules;
  }
}

export default BackstageCatalogEntityPlugin;
