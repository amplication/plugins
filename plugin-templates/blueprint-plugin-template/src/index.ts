import {
  blueprintPluginEventsParams as blueprint,
  blueprintPluginEventsTypes,
  blueprintTypes,
  IFile,
} from "@amplication/code-gen-types";
import { CodeBlock } from "@amplication/csharp-ast";
import { camelCase, kebabCase } from "lodash";
import { resolve, join } from "path";
import { REPLACEMENTS } from "./constants";
import { getPluginSettings } from "./utils";

class BlueprintPluginTemplatePlugin
  implements blueprintTypes.AmplicationPlugin
{
  register(): blueprintPluginEventsTypes.BlueprintEvents {
    return {
      createBlueprint: {
        before: this.beforeCreateBlueprint,
      },
    };
  }
  async beforeCreateBlueprint(
    context: blueprintTypes.DsgContext,
    eventParams: blueprint.CreateBlueprintParams,
  ): Promise<blueprint.CreateBlueprintParams> {
    context.logger.info("Generating Static Files ...");

    // determine the name of the plugin which will be used as the ID for the plugin
    // plugin ID must be in kebab case (lowercase letters and numbers. words may be separated with dashes (-))
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

    const stringReplacements = {
      PluginName: REPLACEMENTS.PLUGIN_CAMEL_CASE_NAME,
    };

    const basePluginPath = `./plugins/${kebabCasePluginName}`;

    context.logger.info(`base plugin path: ${basePluginPath}`);

    // set the path to the static files and fetch them for manipulation
    const staticPath = resolve(__dirname, "./static");
    const files = await context.utils.importStaticFilesWithReplacements(
      staticPath,
      ".",
      REPLACEMENTS,
      stringReplacements,
    );

    for (const file of files.getAll()) {
      const codeBlock: IFile<CodeBlock> = {
        path: join(
          basePluginPath,
          context.utils.replacePlaceholders(file.path, REPLACEMENTS),
        ),
        code: new CodeBlock({
          code: file.code,
        }),
      };
      context.files.set(codeBlock);
    }

    return eventParams;
  }
}

export default BlueprintPluginTemplatePlugin;
