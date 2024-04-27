import {
  CreateEntityResolverBaseParams,
  DsgContext,
  EntityField,
  EnumDataType,
} from "@amplication/code-gen-types";
import {
  addImports,
  getClassDeclarationById,
  importNames,
  interpolate,
} from "../util/ast";
import { namedTypes, builders } from "ast-types";
import { pascalCase } from "pascal-case";

export const beforeCreateEntityResolverBase = async (
  context: DsgContext,
  eventParams: CreateEntityResolverBaseParams,
) => {
  const { entity, template, templateMapping, resolverBaseId } = eventParams;
  const fileDataTypeFields = entity.fields.filter(
    (field) => field.dataType === EnumDataType.File,
  );

  if (fileDataTypeFields.length === 0) {
    return eventParams;
  }

  interpolate(template, templateMapping);

  const classDeclaration = getClassDeclarationById(template, resolverBaseId);

  fileDataTypeFields.forEach((field) =>
    addFileResolverMethods(context, classDeclaration, eventParams, field),
  );

  const graphQLUploadImport = importNames(
    [builders.identifier("GraphQLUpload")],
    "graphql-upload",
  );

  const fileUploadImport = importNames(
    [builders.identifier("FileUpload")],
    "src/storage/base/storage.types",
  );

  const imports = [graphQLUploadImport, fileUploadImport];

  addImports(template, imports);

  return eventParams;
};

const addFileResolverMethods = (
  context: DsgContext,
  classDeclaration: namedTypes.ClassDeclaration,
  eventParams: CreateEntityResolverBaseParams,
  field: EntityField,
) => {
  const { name } = field;
  const { entity } = eventParams;

  const entityId = builders.identifier(pascalCase(entity.name));
  const uploadMethodId = builders.identifier(`upload${pascalCase(name)}`);
  const deleteMethodId = builders.identifier(`delete${pascalCase(name)}`);

  //@graphql.Mutation(() => User)
  const mutationDecorator = builders.decorator(
    builders.callExpression(builders.identifier("graphql.Mutation"), [
      builders.arrowFunctionExpression([], entityId),
    ]),
  );

  const argsParameter = builders.identifier("args");
  argsParameter.typeAnnotation = builders.tsTypeAnnotation(
    builders.tsTypeReference(
      builders.identifier(`${pascalCase(entity.name)}FindUniqueArgs`),
    ),
  );
  // @ts-expect-error decorators are not supported by ast-types
  argsParameter.decorators = [
    builders.decorator(
      builders.callExpression(builders.identifier("graphql.Args"), []),
    ),
  ];

  const fileParameter = builders.identifier("file");
  fileParameter.typeAnnotation = builders.tsTypeAnnotation(
    builders.tsTypeReference(builders.identifier("FileUpload")),
  );
  // @ts-expect-error decorators are not supported by ast-types
  fileParameter.decorators = [
    builders.decorator(
      builders.callExpression(builders.identifier("graphql.Args"), [
        builders.objectExpression([
          builders.objectProperty(
            builders.identifier("name"),
            builders.stringLiteral("file"),
          ),
          builders.objectProperty(
            builders.identifier("type"),
            builders.arrowFunctionExpression(
              [],
              builders.identifier("GraphQLUpload"),
            ),
          ),
        ]),
      ]),
    ),
  ];

  const uploadMethod = getUploadMethod(
    [fileParameter, argsParameter],
    entityId,
    mutationDecorator,
    uploadMethodId,
    name,
  );

  const deleteMethod = getDeleteMethod(
    [argsParameter],
    entityId,
    mutationDecorator,
    deleteMethodId,
    name,
  );

  classDeclaration.body.body.push(uploadMethod, deleteMethod);
};

const getUploadMethod = (
  parameters: namedTypes.Identifier[],
  entityId: namedTypes.Identifier,
  decorator: namedTypes.Decorator,
  methodId: namedTypes.Identifier,
  fieldName: string,
) => {
  const method = builders.classMethod.from({
    kind: "method",
    async: true,
    key: methodId,
    params: parameters,
    decorators: [decorator],
    returnType: builders.tsTypeAnnotation(
      builders.tsTypeReference(
        builders.identifier("Promise"),
        builders.tsTypeParameterInstantiation([
          builders.tsTypeReference(entityId),
        ]),
      ),
    ),
    body: builders.blockStatement([
      builders.returnStatement(
        builders.awaitExpression(
          builders.callExpression(
            builders.memberExpression(
              builders.memberExpression(
                builders.thisExpression(),
                builders.identifier("service"),
              ),
              builders.identifier(`upload${pascalCase(fieldName)}`),
            ),
            [builders.identifier("args"), builders.identifier("file")],
          ),
        ),
      ),
    ]),
  });

  return method;
};

const getDeleteMethod = (
  parameters: namedTypes.Identifier[],
  entityId: namedTypes.Identifier,
  decorator: namedTypes.Decorator,
  methodId: namedTypes.Identifier,
  fieldName: string,
) => {
  const method = builders.classMethod.from({
    kind: "method",
    key: methodId,
    async: true,
    params: parameters,
    decorators: [decorator],
    returnType: builders.tsTypeAnnotation(
      builders.tsTypeReference(
        builders.identifier("Promise"),
        builders.tsTypeParameterInstantiation([
          builders.tsTypeReference(entityId),
        ]),
      ),
    ),
    body: builders.blockStatement([
      builders.returnStatement(
        builders.awaitExpression(
          builders.callExpression(
            builders.memberExpression(
              builders.memberExpression(
                builders.thisExpression(),
                builders.identifier("service"),
              ),
              builders.identifier(`delete${pascalCase(fieldName)}`),
            ),
            [builders.identifier("args")],
          ),
        ),
      ),
    ]),
  });

  return method;
};
