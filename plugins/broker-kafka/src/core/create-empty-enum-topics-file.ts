import { DsgContext, Module, ModuleMap } from "@amplication/code-gen-types";
import { getMessageBrokerName } from "./get-message-broker-name";
import { builders } from "ast-types";
import { EnumBuilder, print } from "@amplication/code-gen-utils";
import { pascalCase } from "pascal-case";
import { join } from "path";

export async function createEmptyEnumTopicsFile(
  context: DsgContext
): Promise<ModuleMap> {
  const messageBrokerName = getMessageBrokerName(context);

  const enumTopicsFile = builders.file(builders.program([]));
  const enumBuilder = new EnumBuilder(pascalCase(messageBrokerName) + "Topics");

  const enumExportDeclaration = builders.exportDeclaration(
    false,
    enumBuilder.ast
  );
  enumTopicsFile.program.body.push(enumExportDeclaration);

  const path = join(
    context.serverDirectories.messageBrokerDirectory,
    "topics.ts"
  );
  const module: Module = {
    path,
    code: print(enumTopicsFile).code,
  };
  const moduleMap = new ModuleMap(context.logger);
  await moduleMap.set(module);
  return moduleMap;
}
