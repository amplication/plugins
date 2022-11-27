import { builders, namedTypes } from "ast-types";

const { identifier, blockStatement, classMethod } = builders;

export function addLoginFunction(clientClass: namedTypes.ClassDeclaration) {
  const loginFunction = classMethod(
    "method",
    identifier("login"),
    [],
    blockStatement([]),
    false,
    false
  );
  loginFunction.async = true;
  clientClass.body.body.push(loginFunction);
}
