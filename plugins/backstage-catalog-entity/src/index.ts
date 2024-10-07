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
  appUrlKey,
  specLifecycleKey,
  specOwnerKey,
  specTypeKey,
  defaultNamePrefix,
  defaultDescription,
  defaultLabels,
  defaultAnnotations,
  defaultUrl,
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
    const serviceType = "service";
    const serviceUrl = context.resourceInfo?.url;

    const settings = getPluginSettings(context.pluginInstallations);

    const staticPath = resolve(__dirname, "./static/");
    const staticFiles = await context.utils.importStaticModules(
      staticPath,
      "./"
    );

    let labels = `labels:`;
    let annotations = `annotations:`;
    let tags = `tags:`;

    const indentation = "    ";

    const name = settings.prefix_name
      ? `${settings.prefix_name}-${serviceName}`
      : `${defaultNamePrefix}-${serviceName}`;

    const description = serviceDescription ?? defaultDescription;

    const l = settings.labels ?? defaultLabels;

    if (typeof l === "object" && l !== null) {
      Object.entries(l).forEach(([name, value]) => {
        labels = `${labels}\n${indentation}${name}: "${value}"`;
      });
    } else {
      context.logger.info(`"Labels should be an object:"`, l);
    }

    const a = settings.annotations ?? defaultAnnotations;

    if (typeof a === "object" && a !== null) {
      Object.entries(a).forEach(([name, value]) => {
        annotations = `${annotations}\n${indentation}${name}: "${value}"`;
      });
    } else {
      context.logger.info(`"Annotations should be an object:"`, a);
    }

    // Handling tags (Array)
    const t = settings.tags ?? defaultTags;

    if (Array.isArray(t)) {
      t.forEach((tag) => {
        tags = `${tags}\n${indentation}- "${tag}"`;
      });
    } else {
      context.logger.info(`"Tags should be an array:"`, t);
    }

    const appUrl = serviceUrl ?? defaultUrl;

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
        .replace(appUrlKey, appUrl)
        .replace(specTypeKey, type)
        .replace(specLifecycleKey, lifecycle)
        .replace(specOwnerKey, owner)
    );

    await modules.merge(staticFiles);
    context.logger.info(`Generated ${pluginDescription}...`);
    return modules;
  }
}

export default BackstageCatalogEntityPlugin;
