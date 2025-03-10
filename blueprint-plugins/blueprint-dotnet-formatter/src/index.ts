import {
  blueprintPluginEventsParams as blueprint,
  blueprintPluginEventsTypes,
  blueprintTypes,
  FileMap,
} from "@amplication/code-gen-types";
import { CodeBlock } from "@amplication/csharp-ast";
import { externalFormatting } from "./fortmatter";

class fibiNetFormatter implements blueprintTypes.AmplicationPlugin {
  register(): blueprintPluginEventsTypes.BlueprintEvents {
    return {
      createBlueprint: {
        after: this.afterCreateBlueprint,
      },
    };
  }
  async afterCreateBlueprint(
    context: blueprintTypes.DsgContext,
    eventParams: blueprint.CreateBlueprintParams,
    files: FileMap<CodeBlock>,
  ): Promise<FileMap<CodeBlock>> {
    context.logger.info("Formatting files with csharpier...");

    await externalFormatting(context);

    return files;
  }
}

export default fibiNetFormatter;
