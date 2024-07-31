import {
  dotnetPluginEventsTypes,
  dotnetPluginEventsParams as dotnet,
  dotnetTypes,
  FileMap,
  IFile,
} from "@amplication/code-gen-types";
import { CodeBlock } from "@amplication/csharp-ast";
import {
  applicationVersionKey,
  chartVersionKey,
  configurationKey,
  hostKey,
  portKey,
  repositoryKey,
  serviceNameKey,
  tagKey,
} from "./constants";
import { join } from "node:path";
import { getPluginSettings } from "./utils";
import { resolve } from "path";
import { kebabCase } from "lodash";

class HelmChartPlugin implements dotnetTypes.AmplicationPlugin {
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
    context.logger.info(`Generating Helm Chart...`);
    const serviceName = kebabCase(context.resourceInfo?.name);
    if (!serviceName) {
      throw new Error("Service name is undefined");
    }

    const settings = getPluginSettings(context.pluginInstallations);
    let helmDirectoryPath = "";
    const rootDirectoryPath = "./";

    if (settings.root_level === true) {
      helmDirectoryPath = join(
        rootDirectoryPath,
        settings.directory_name,
        serviceName
      );
    } else if (settings.root_level === false) {
      helmDirectoryPath = join(
        context.serverDirectories.baseDirectory,
        settings.directory_name,
        serviceName
      );
    } else {
      throw new Error(
        "HelmChartPlugin: Specify true or false for the root_level setting"
      );
    }
    const chartTemplateDirectory = "./static/chart";
    const chartTemplatePath = resolve(__dirname, chartTemplateDirectory);
    const chartTemplateFiles = await context.utils.importStaticFiles(
      chartTemplatePath,
      helmDirectoryPath
    );

    const fileMap = new FileMap<CodeBlock>(context.logger);
    await context.logger.info("Configuring Helm Charts template...");
    for (const item of chartTemplateFiles.getAll()) {
      const newCode = item.code
        .replaceAll(serviceNameKey, serviceName)
        .replaceAll(chartVersionKey, settings.server.chart_version)
        .replaceAll(applicationVersionKey, settings.server.application_version)
        .replaceAll(repositoryKey, settings.server.repository)
        .replaceAll(tagKey, settings.server.tag)
        .replaceAll(portKey, settings.server.port)
        .replaceAll(hostKey, settings.server.host)
        .replaceAll(configurationKey, "");
      const file: IFile<CodeBlock> = {
        path: item.path,
        code: new CodeBlock({
          code: newCode,
        }),
      };
      fileMap.set(file);
    }

    await files.merge(fileMap);
    return files;
  }
}

export default HelmChartPlugin;
