import {
  DsgContext,
  CreateEntityModuleParams,
} from "@amplication/code-gen-types";
import { builders, namedTypes } from "ast-types";
import {
  importNames,
  interpolate,
  AddIdentifierFromModuleDecorator,
  addImports,
} from "../util/ast";

export async function beforeCreateEntityModule(
  context: DsgContext,
  eventParams: CreateEntityModuleParams
) {
  const { template, templateMapping } = eventParams;
  const authModuleId = builders.identifier("AuthModule");
  const forwardRefId = builders.identifier("forwardRef");
  const forwardRefArrowFunction = builders.arrowFunctionExpression(
    [],
    authModuleId
  );

  const forwardAuthId = builders.callExpression(forwardRefId, [
    forwardRefArrowFunction,
  ]);

  const authModuleImport = importNames([authModuleId], "../auth/auth.module");
  const forwardRefImport = importNames([forwardRefId], "@nestjs/common");

  interpolate(template, templateMapping);

  AddIdentifierFromModuleDecorator(
    template,
    templateMapping["MODULE_BASE"],
    forwardAuthId
  );

  addImports(
    template,
    [authModuleImport, forwardRefImport].filter(
      (x) => x //remove nulls and undefined
    ) as namedTypes.ImportDeclaration[]
  );

  return eventParams;
}
