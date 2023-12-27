import { appendImports } from "@amplication/code-gen-utils";
import { namedTypes, builders } from "ast-types";
import { addGenSupertokensOptionsImport } from "./addGenSupertokensOptionsImport";

export const addAppCorsSettings = (
  template: namedTypes.File,
  func: namedTypes.FunctionDeclaration
) => {
  appendImports(template, [supertokensImport()]);
  addGenSupertokensOptionsImport(template);

  func.body.body.push(enableCorsStatement());
};

const enableCorsStatement = (): namedTypes.ExpressionStatement => {
  return builders.expressionStatement(
    appCallExpression("enableCors", [
      builders.objectExpression([
        allowOriginWebsiteDomainProp(),
        allowedSupertokenHeadersProp(),
        builders.objectProperty(
          builders.identifier("credentials"),
          builders.booleanLiteral(true)
        ),
      ]),
    ])
  );
};

const allowedSupertokenHeadersProp = (): namedTypes.ObjectProperty => {
  return builders.objectProperty(
    builders.identifier("allowedHeaders"),
    builders.arrayExpression([
      builders.stringLiteral("content-type"),
      builders.spreadElement(
        builders.callExpression(
          builders.memberExpression(
            builders.identifier("supertokens"),
            builders.identifier("getAllCORSHeaders")
          ),
          []
        )
      ),
    ])
  );
};

const allowOriginWebsiteDomainProp = (): namedTypes.ObjectProperty => {
  return builders.objectProperty(
    builders.identifier("origin"),
    builders.arrayExpression([
      builders.memberExpression(
        builders.memberExpression(
          builders.callExpression(
            builders.identifier("generateSupertokensOptions"),
            [builders.identifier("configService")]
          ),
          builders.identifier("appInfo")
        ),
        builders.identifier("websiteDomain")
      ),
    ])
  );
};

const supertokensImport = (): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [builders.importDefaultSpecifier(builders.identifier("supertokens"))],
    builders.stringLiteral("supertokens-node")
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
