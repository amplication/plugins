import { builders, namedTypes } from "ast-types";
import { interpolate } from "../util/ast";
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
  "grpc.client.options.template.ts",
);
const fileName = "grpc.client.options.ts";

export async function createGrpcClientOptionsFile(
  context: DsgContext,
): Promise<Module> {
  const template = await readFile(grpcClientOptionsPath);
  const { serverDirectories, entities } = context;

  const packages: namedTypes.ArrayExpression = {
    elements: [],
    type: "ArrayExpression",
  };
  const protoPaths: namedTypes.ArrayExpression = {
    elements: [],
    type: "ArrayExpression",
  };

  entities?.forEach((entity) => {
    const entityNameLowerCase = entity.name.toLowerCase();
    packages.elements.push(builders.stringLiteral(entityNameLowerCase));
    const entityProtoPath = builders.stringLiteral(
      `src/${entityNameLowerCase}/${entityNameLowerCase}.proto`,
    );

    protoPaths.elements.push(entityProtoPath);
  });

  const packagesArray = packages;

  const protoPathArray = protoPaths;

  const templateMapping = {
    PACKAGES_ARRAY: packagesArray,
    PROTO_PATH_ARRAY: protoPathArray,
    PORT_PATH: builders.stringLiteral("localhost:9090"),
  };

  const filePath = `${serverDirectories.srcDirectory}/${fileName}`;

  interpolate(template, templateMapping);

  removeTSClassDeclares(template);

  return {
    code: print(template).code,
    path: filePath,
  };
}
