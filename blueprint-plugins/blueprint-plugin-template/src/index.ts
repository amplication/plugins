import {
  blueprintPluginEventsParams as blueprint,
  blueprintPluginEventsTypes,
  blueprintTypes,
  FileMap,
  IFile,
} from "@amplication/code-gen-types";
import { CodeBlock } from "@amplication/csharp-ast";
import { camelCase, kebabCase } from "lodash";
import { resolve, join } from "path";
import { REPLACEMENTS } from "./constants";
import { replacePlaceholders, getPluginSettings } from "./utils";

class BlueprintPluginTemplatePlugin
  implements blueprintTypes.AmplicationPlugin
{
  register(): blueprintPluginEventsTypes.BlueprintEvents {
    return {
      createBlueprint: {
        after: this.afterLoadStaticFiles,
      },
    };
  }
  async afterLoadStaticFiles(
    context: blueprintTypes.DsgContext,
    eventParams: blueprint.CreateBlueprintParams,
    files: FileMap<CodeBlock>,
  ): Promise<FileMap<CodeBlock>> {
    context.logger.info("Generating Static Files ...");

    // determine the name of the service which will be used as the name for the workflow
    // workflow names must be lower case letters and numbers. words may be separated with dashes (-):
    const pluginName = context.resourceInfo?.name || "plugin";

    const kebabCasePluginName = kebabCase(pluginName.trim());

    REPLACEMENTS.PLUGIN_KEBAB_CASE_NAME = kebabCasePluginName;
    REPLACEMENTS.PLUGIN_CAMEL_CASE_NAME = camelCase(pluginName);
    REPLACEMENTS.PLUGIN_DISPLAY_NAME = pluginName;
    REPLACEMENTS.PLUGIN_DESCRIPTION = context.resourceInfo?.description ?? " ";

    const settings = getPluginSettings(context.pluginInstallations);

    context.logger.info(`settings: ${JSON.stringify(settings)}`);

    REPLACEMENTS.AUTHOR = settings.author;
    REPLACEMENTS.LICENSE = settings.license;
    REPLACEMENTS.COPY_PLUGIN_SETTINGS = JSON.stringify(
      settings.copyPluginSettings,
      null,
      2,
    );

    const basePluginPath = `./plugins/${kebabCasePluginName}`;

    context.logger.info(`base plugin path: ${basePluginPath}`);

    // set the path to the static files and fetch them for manipulation
    const staticPath = resolve(__dirname, "./static");
    const staticFiles = await context.utils.importStaticFiles(staticPath, "./");

    for (const item of staticFiles.getAll()) {
      item.code = replacePlaceholders(item.code, REPLACEMENTS);

      item.path = join(
        basePluginPath,
        replacePlaceholders(item.path, REPLACEMENTS),
      );

      context.logger.info(`generating file at path: ${item.path}`);

      const file: IFile<CodeBlock> = {
        path: item.path,
        code: new CodeBlock({
          code: item.code,
        }),
      };
      files.set(file);
    }
    return files;
  }
}

export default BlueprintPluginTemplatePlugin;
