import {
  BlockStatement,
  ExportNamedDeclaration,
  FunctionDeclaration,
  Statement,
} from "@babel/types";
import { builders, namedTypes } from "ast-types";
import { addImports, importNames } from "../util/ast";

export async function connectGrpcMicroService(template: namedTypes.File) {
  const grpcClientOptionsImport = importNames(
    [builders.identifier("grpcClientOptions")],
    "./grpc.client.options"
  );

  addImports(
    template,
    [grpcClientOptionsImport].filter(
      (x) => x //remove nulls and undefined
    ) as namedTypes.ImportDeclaration[]
  );

  const grpcMicroServiceCallExpression = builders.callExpression(
    builders.memberExpression(
      builders.identifier("app"),
      builders.identifier("connectMicroservice")
    ),
    [builders.identifier("grpcClientOptions")]
  );

  const typeArguments = builders.tsTypeParameterInstantiation([
    builders.tsTypeReference(builders.identifier("MicroserviceOptions")),
  ]);

  grpcMicroServiceCallExpression.typeArguments =
    typeArguments as unknown as namedTypes.TypeParameterInstantiation;

  const exportNameDeclarationFromBody = template.program.body.find(
    (func) => func.type === "ExportNamedDeclaration"
  ) as ExportNamedDeclaration;

  const func = exportNameDeclarationFromBody.declaration as FunctionDeclaration;

  console.log("exportNameDeclarationFromBody: ", exportNameDeclarationFromBody);

  func.body.body.push(
    builders.expressionStatement(grpcMicroServiceCallExpression) as Statement
  );
}
