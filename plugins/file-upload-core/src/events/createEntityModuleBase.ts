import {
  CreateEntityModuleBaseParams,
  DsgContext,
} from "@amplication/code-gen-types";
import { addImports, importNames } from "../util/ast";
import { builders } from "ast-types";
import { camelCase } from "lodash";

export const beforeCreateEntityModuleBase = async (
  context: DsgContext,
  eventParams: CreateEntityModuleBaseParams,
) => {
  const { entities } = context;
  const { template, templateMapping, entityName } = eventParams;

  console.log("beforeCreateEntityModuleBase", entityName);

  if (
    entities
      ?.find((entity) => camelCase(entity.name) === entityName)
      ?.fields?.some((field) => field.dataType === "File")
  ) {
    const storageModuleId = builders.identifier("StorageModule");
    const storageModuleImport = importNames(
      [storageModuleId],
      "src/storage/storage.module",
    );

    addImports(template, [storageModuleImport]);

    const importArray = builders.arrayExpression([
      storageModuleId,
      ...templateMapping["IMPORTS_ARRAY"].elements,
    ]);

    templateMapping["IMPORTS_ARRAY"] = importArray;
  }

  return eventParams;
};
