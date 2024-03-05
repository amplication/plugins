import {
  DsgContext,
  CreateEntityModuleBaseParams,
} from "@amplication/code-gen-types";
import { builders, namedTypes } from "ast-types";
import { importNames, addImports } from "../util/ast";

export async function beforeCreateEntityModuleBase(
  context: DsgContext,
  eventParams: CreateEntityModuleBaseParams
) {
  const aclModuleId = builders.identifier("ACLModule");

  const aclModuleImport = importNames([aclModuleId], "../../auth/acl.module");

  const importArray = builders.arrayExpression([
    aclModuleId,
    ...eventParams.templateMapping["IMPORTS_ARRAY"].elements,
  ]);

  const exportArray = builders.arrayExpression([
    aclModuleId,
    ...eventParams.templateMapping["EXPORT_ARRAY"].elements,
  ]);

  eventParams.templateMapping["IMPORTS_ARRAY"] = importArray;
  eventParams.templateMapping["EXPORT_ARRAY"] = exportArray;

  addImports(
    eventParams.template,
    [aclModuleImport].filter(
      (x) => x //remove nulls and undefined
    ) as namedTypes.ImportDeclaration[]
  );
  return eventParams;
}
