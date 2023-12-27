import { appendImports } from "@amplication/code-gen-utils";
import { namedTypes, builders } from "ast-types";

export const addGenSupertokensOptionsImport = (template: namedTypes.File) => {
  appendImports(template, [genSupertokensOptionsImport()]);
};

const genSupertokensOptionsImport = (): namedTypes.ImportDeclaration => {
  return builders.importDeclaration(
    [
      builders.importSpecifier(
        builders.identifier("generateSupertokensOptions")
      ),
    ],
    builders.stringLiteral("./auth/supertokens/generateSupertokensOptions")
  );
};
