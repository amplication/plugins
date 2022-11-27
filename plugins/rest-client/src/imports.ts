import { builders } from "ast-types";

const { identifier, importDeclaration, stringLiteral, importSpecifier } =
  builders;

export const axiosClassImport = importDeclaration(
  [importSpecifier(identifier("Axios"))],
  stringLiteral("axios")
);
