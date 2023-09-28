import { builders, namedTypes } from "ast-types";
import { addImports, importNames, interpolate } from "../util/ast";
import { join } from "path";
import { templatesPath } from "../constants";
import {
  readFile,
  removeTSClassDeclares,
  print,
} from "@amplication/code-gen-utils";
import { DsgContext, Module } from "@amplication/code-gen-types";

const grpcClientOptionsPath = join(
  templatesPath,
  "grpc.client.options.template.ts"
);
const fileName = "grpc.client.options.ts";

export async function createGrpcClientOptionsFile(
  context: DsgContext
): Promise<Module> {
  const template = await readFile(grpcClientOptionsPath);
  const { serverDirectories, entities } = context;

  let packages: namedTypes.ArrayExpression = {
    elements: [],
    type: "ArrayExpression",
  };
  let protoPaths: namedTypes.ArrayExpression = {
    elements: [],
    type: "ArrayExpression",
  };

  entities?.forEach((entity) => {
    packages.elements.push(builders.stringLiteral(entity.name));
    const entityProtoPath = builders.callExpression(
      builders.identifier("join"),
      [
        builders.identifier("__dirname"),
        builders.stringLiteral(`${entity.name}/${entity.name}.proto`),
      ]
    );
    protoPaths.elements.push(entityProtoPath);
  });

  const packagesArray = packages;

  const protoPathArray = protoPaths;

  const templateMapping = {
    PACKAGES_ARRAY: packagesArray,
    PROTO_PATH_ARRAY: protoPathArray,
  };

  const filePath = `${serverDirectories.srcDirectory}/${fileName}`;

  interpolate(template, templateMapping);

  removeTSClassDeclares(template);

  return {
    code: print(template).code,
    path: filePath,
  };
}
