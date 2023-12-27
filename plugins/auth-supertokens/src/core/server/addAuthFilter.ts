import { appendImports } from "@amplication/code-gen-utils";
import { namedTypes, builders } from "ast-types";

export const addAuthFilter = (
  template: namedTypes.File,
  func: namedTypes.FunctionDeclaration
) => {
  appendImports(template, [authFilterImport()]);
  func.body.body.push(globalFiltersStatement());
};

const globalFiltersStatement = (): namedTypes.ExpressionStatement => {
  return builders.expressionStatement(
    appCallExpression("useGlobalFilters", [
      builders.newExpression(builders.identifier("STAuthFilter"), []),
    ])
  );
};

const authFilterImport = (): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importSpecifier(builders.identifier("STAuthFilter"))],
    builders.stringLiteral("./auth/supertokens/auth.filter")
  );
};

const appCallExpression = (
  funcName: string,
  params: namedTypes.CallExpression["arguments"]
): namedTypes.CallExpression => {
  return builders.callExpression(
    builders.memberExpression(
      builders.identifier("app"),
      builders.identifier(funcName)
    ),
    params
  );
};
