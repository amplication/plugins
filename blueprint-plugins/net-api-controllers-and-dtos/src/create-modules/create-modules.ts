import { FileMap, blueprintTypes } from "@amplication/code-gen-types";

import { AstNode } from "@amplication/csharp-ast";
import { createServiceFiles } from "./create-module-service";
import { createControllerFiles } from "./create-module-controller";
import { createDtoFiles } from "./create-module-dto";
import { createInterfaceFiles } from "./create-module-interface";

export async function createModulesFiles(
  context: blueprintTypes.DsgContext,
  resourceName: string,
): Promise<FileMap<AstNode>> {
  const { logger, moduleActionsAndDtoMap } = context;
  const files = new FileMap<AstNode>(logger);

  for (const moduleActionsAndDtos of Object.values(moduleActionsAndDtoMap)) {
    // TODO: This is temporary. We need to refactor the entity modules to work with this implementation, so the filter is just until we refactor the entity modules
    if (moduleActionsAndDtos.moduleContainer.entityId) {
      continue;
    }

    await files.mergeMany([
      await createDtoFiles(moduleActionsAndDtos, context, resourceName),
      await createInterfaceFiles(moduleActionsAndDtos, context, resourceName),
      await createServiceFiles(moduleActionsAndDtos, context, resourceName),
      await createControllerFiles(moduleActionsAndDtos, context, resourceName),
    ]);
  }

  return files;
}
