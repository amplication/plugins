import {
  blueprintPluginEventsParams as blueprint,
  blueprintPluginEventsTypes,
  blueprintTypes,
  IFile,
} from "@amplication/code-gen-types";
import { CodeBlock } from "@amplication/csharp-ast";
import { resolve } from "path";
import { pascalCase } from "pascal-case";

class PluginName implements blueprintTypes.AmplicationPlugin {
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
    context.logger.info("Generating Files from PluginName...");

    const params = {} as Record<string, string>;

    params.SERVICE_DISPLAY_NAME = context.resourceInfo?.name || "Service Name";
    params.SERVICE_NAME = pascalCase(params.SERVICE_DISPLAY_NAME);

    //resource catalog properties
    const resourceCatalogProperties = (context.resourceInfo?.properties ||
      {}) as Record<string, string>;
    const resourceSetting = (context.resourceSettings?.properties ||
      ({} as Record<string, string>)) as Record<string, string>;

    //all catalog and resource settings are available for use in the template
    const placeholders = {
      ...params,
      ...resourceCatalogProperties,
      ...resourceSetting,
    };

    const stringReplacements = {
      ServiceName: params.SERVICE_NAME,
    };

    // set the path to the static files and fetch them for manipulation
    const staticPath = resolve(__dirname, "./static");
    const files = await context.utils.importStaticFilesWithReplacements(
      staticPath,
      ".",
      placeholders,
      stringReplacements,
    );

    for (const file of files.getAll()) {
      const codeBlock: IFile<CodeBlock> = {
        path: file.path,
        code: new CodeBlock({
          code: file.code,
        }),
      };
      context.files.set(codeBlock);
    }
    return eventParams;
  }
}

export default PluginName;
