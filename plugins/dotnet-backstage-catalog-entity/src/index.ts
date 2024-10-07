import type {
  dotnetPluginEventsTypes,
  dotnetPluginEventsParams as dotnet,
  dotnetTypes,
  FileMap,
  IFile,
} from "@amplication/code-gen-types";
import { CodeBlock } from "@amplication/csharp-ast";
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
import { getPluginSettings } from "./utils";

const pluginDescription = "Backstage Catalog Entity file";

class BackstageCatalogEntityPlugin implements dotnetTypes.AmplicationPlugin {
  register(): dotnetPluginEventsTypes.DotnetEvents {
    return {
      LoadStaticFiles: {
        after: this.afterLoadStaticFiles,
      },
    };
  }

  async afterLoadStaticFiles(
    context: dotnetTypes.DsgContext,
    eventParams: dotnet.LoadStaticFilesParams,
    files: FileMap<CodeBlock>
  ): Promise<FileMap<CodeBlock>> {
    context.logger.info(`Generating ${pluginDescription}...`);

    const serviceName = kebabCase(context.resourceInfo?.name);
    const serviceDescription = context.resourceInfo?.description;
    const serviceType = "service";
    const serviceUrl = context.resourceInfo?.url;

    const settings = getPluginSettings(context.pluginInstallations);

    const staticPath = resolve(__dirname, "./static/");
    const staticFiles = await context.utils.importStaticFiles(staticPath, "./");

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

    context.logger.info(`Generated ${pluginDescription}...`);
    for (const item of staticFiles.getAll()) {
      const newCode = item.code
        .replace(metadataNameKey, name)
        .replace(metadataDescriptionKey, description)
        .replace(metadataLabelsKey, labels)
        .replace(metadataAnnotationsKey, annotations)
        .replace(metadataTagsKey, tags)
        .replace(appUrlKey, appUrl)
        .replace(specTypeKey, type)
        .replace(specLifecycleKey, lifecycle)
        .replace(specOwnerKey, owner);

      const file: IFile<CodeBlock> = {
        path: item.path,
        code: new CodeBlock({
          code: newCode,
        }),
      };
      files.set(file);
    }

    return files;
  }
}

export default BackstageCatalogEntityPlugin;
