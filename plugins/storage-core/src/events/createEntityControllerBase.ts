import {
  CreateEntityControllerBaseParams,
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
import { builders, namedTypes } from "ast-types";
import { pascalCase } from "pascal-case";

export const beforeCreateEntityControllerBase = async (
  context: DsgContext,
  eventParams: CreateEntityControllerBaseParams,
) => {
  const { controllerBaseId, entity, template, templateMapping } = eventParams;
  const fileDataTypeFields = entity.fields.filter(
    (field) => field.dataType === EnumDataType.File,
  );

  if (fileDataTypeFields.length === 0) {
    return eventParams;
  }

  interpolate(template, templateMapping);

  const classDeclaration = getClassDeclarationById(template, controllerBaseId);

  fileDataTypeFields.forEach((field) =>
    addFileFieldMethods(context, classDeclaration, eventParams, field),
  );

  const fileInterceptorImport = importNames(
    [builders.identifier("FileInterceptor")],
    "@nestjs/platform-express",
  );

  const ResponseImport = importNames(
    [builders.identifier("Response")],
    "express",
  );

  addImports(template, [fileInterceptorImport, ResponseImport]);

  return eventParams;
};

const addFileFieldMethods = async (
  context: DsgContext,
  classDeclaration: namedTypes.ClassDeclaration,
  eventParams: CreateEntityControllerBaseParams,
  field: EntityField,
) => {
  const { name } = field;
  const { entity } = eventParams;

  const entityId = builders.identifier(pascalCase(entity.name));
  const uploadMethodId = builders.identifier(`upload${pascalCase(name)}`);
  const downloadMethodId = builders.identifier(`download${pascalCase(name)}`);
  const deleteMethodId = builders.identifier(`delete${pascalCase(name)}`);

  // @common.Param() params: UserWhereUniqueInput
  const paramParameter = builders.identifier("params");
  paramParameter.typeAnnotation = builders.tsTypeAnnotation(
    builders.tsTypeReference(
      builders.identifier(`${pascalCase(entity.name)}WhereUniqueInput`),
    ),
  );
  // @ts-expect-error - property is missing in ast-types
  paramParameter.decorators = [
    builders.decorator(
      builders.callExpression(builders.identifier("common.Param"), []),
    ),
  ];

  // @common.UploadedFile() file: Express.Multer.File
  const fileParameter = builders.identifier("file");
  fileParameter.typeAnnotation = builders.tsTypeAnnotation(
    builders.tsTypeReference(builders.identifier("Express.Multer.File")),
  );
  // @ts-expect-error - property is missing in ast-types
  fileParameter.decorators = [
    builders.decorator(
      builders.callExpression(builders.identifier("common.UploadedFile"), []),
    ),
  ];

  // @common.Res({ passthrough: true }) res: Response
  const resParameter = builders.identifier("res");
  resParameter.typeAnnotation = builders.tsTypeAnnotation(
    builders.tsTypeReference(builders.identifier("Response")),
  );
  // @ts-expect-error - property is missing in ast-types
  resParameter.decorators = [
    builders.decorator(
      builders.callExpression(builders.identifier("common.Res"), [
        builders.objectExpression([
          builders.property(
            "init",
            builders.identifier("passthrough"),
            builders.literal(true),
          ),
        ]),
      ]),
    ),
  ];

  const uploadMethod = getUploadMethod(
    [paramParameter, fileParameter],
    uploadMethodId,
    entityId,
    name,
  );

  const downloadMethod = getDownloadMethod(
    [paramParameter, resParameter],
    downloadMethodId,
    entityId,
    name,
  );

  const deleteMethod = getDeleteMethod(
    [paramParameter],
    deleteMethodId,
    entityId,
    name,
  );

  classDeclaration.body.body.push(uploadMethod, downloadMethod, deleteMethod);
};

const swaggerApiNotFoundResponseDecorator = builders.decorator(
  builders.callExpression(builders.identifier("swagger.ApiNotFoundResponse"), [
    builders.objectExpression([
      builders.property(
        "init",
        builders.identifier("type"),
        builders.memberExpression(
          builders.identifier("errors"),
          builders.identifier("NotFoundException"),
        ),
      ),
    ]),
  ]),
);

const getDownloadMethod = (
  params: namedTypes.Identifier[],
  methodId: namedTypes.Identifier,
  entityId: namedTypes.Identifier,
  name: string,
) => {
  const getDecorator = builders.decorator(
    builders.callExpression(builders.identifier("common.Get"), [
      builders.literal(`:id/${name}`),
    ]),
  );

  const swaggerApiParamDecorator = builders.decorator(
    builders.callExpression(builders.identifier("swagger.ApiParam"), [
      builders.objectExpression([
        builders.property(
          "init",
          builders.identifier("name"),
          builders.literal("id"),
        ),
        builders.property(
          "init",
          builders.identifier("type"),
          builders.literal("string"),
        ),
        builders.property(
          "init",
          builders.identifier("required"),
          builders.literal(true),
        ),
      ]),
    ]),
  );

  const swaggerApiOkResponseDecorator = builders.decorator(
    builders.callExpression(builders.identifier("swagger.ApiOkResponse"), [
      builders.objectExpression([
        builders.property(
          "init",
          builders.identifier("type"),
          builders.identifier("common.StreamableFile"),
        ),
      ]),
    ]),
  );

  return builders.classMethod.from({
    async: true,
    key: methodId,
    params: params,
    decorators: [
      getDecorator,
      swaggerApiParamDecorator,
      swaggerApiOkResponseDecorator,
      swaggerApiNotFoundResponseDecorator,
    ],
    returnType: builders.tsTypeAnnotation(
      builders.tsTypeReference(
        builders.identifier("Promise"),
        builders.tsTypeParameterInstantiation([
          builders.tsTypeReference(
            builders.identifier("common.StreamableFile"),
          ),
        ]),
      ),
    ),
    body: builders.blockStatement([
      builders.variableDeclaration("const", [
        builders.variableDeclarator(
          builders.identifier("result"),
          builders.awaitExpression(
            builders.callExpression(
              builders.memberExpression(
                builders.identifier("this.service"),
                builders.identifier(`download${pascalCase(name)}`),
              ),
              [
                builders.objectExpression([
                  builders.property(
                    "init",
                    builders.identifier("where"),
                    builders.identifier("params"),
                  ),
                ]),
              ],
            ),
          ),
        ),
      ]),
      builders.ifStatement(
        builders.binaryExpression(
          "===",
          builders.identifier("result"),
          builders.literal(null),
        ),
        builders.blockStatement([
          builders.throwStatement(
            builders.newExpression(
              builders.identifier("errors.NotFoundException"),
              [
                builders.templateLiteral(
                  [
                    builders.templateElement(
                      {
                        raw: `No resource was found for `,
                        cooked: `No resource was found for `,
                      },
                      false,
                    ),
                  ],
                  [],
                ),
                builders.callExpression(builders.identifier("JSON.stringify"), [
                  builders.identifier("params"),
                ]),
              ],
            ),
          ),
        ]),
      ),
      builders.expressionStatement(
        builders.callExpression(
          builders.memberExpression(
            builders.identifier("res"),
            builders.identifier("setHeader"),
          ),
          [
            builders.literal("Content-Disposition"),
            builders.templateLiteral(
              [
                builders.templateElement(
                  {
                    raw: `attachment; filename=`,
                    cooked: `attachment; filename=`,
                  },
                  false,
                ),
              ],
              [builders.identifier("result.filename")],
            ),
          ],
        ),
      ),
      builders.expressionStatement(
        builders.callExpression(
          builders.memberExpression(
            builders.identifier("res"),
            builders.identifier("setHeader"),
          ),
          [
            builders.literal("Content-Type"),
            builders.identifier("result.mimetype"),
          ],
        ),
      ),
      builders.returnStatement(builders.identifier("result.stream")),
    ]),
  });
};

const getUploadMethod = (
  params: namedTypes.Identifier[],
  methodId: namedTypes.Identifier,
  entityId: namedTypes.Identifier,
  name: string,
) => {
  const putDecorator = builders.decorator(
    builders.callExpression(builders.identifier("common.Put"), [
      builders.literal(`:id/${name}`),
    ]),
  );

  const interceptorDecorator = builders.decorator(
    builders.callExpression(builders.identifier("common.UseInterceptors"), [
      builders.callExpression(builders.identifier("FileInterceptor"), [
        builders.literal("file"),
      ]),
    ]),
  );

  const consumesDecorator = builders.decorator(
    builders.callExpression(builders.identifier("swagger.ApiConsumes"), [
      builders.literal("multipart/form-data"),
    ]),
  );

  const bodyDecorator = builders.decorator(
    builders.callExpression(builders.identifier("swagger.ApiBody"), [
      builders.objectExpression([
        builders.property(
          "init",
          builders.identifier("schema"),
          builders.objectExpression([
            builders.property(
              "init",
              builders.identifier("type"),
              builders.literal("object"),
            ),
            builders.property(
              "init",
              builders.identifier("properties"),
              builders.objectExpression([
                builders.property(
                  "init",
                  builders.identifier("file"),
                  builders.objectExpression([
                    builders.property(
                      "init",
                      builders.identifier("type"),
                      builders.literal("string"),
                    ),
                    builders.property(
                      "init",
                      builders.identifier("format"),
                      builders.literal("binary"),
                    ),
                  ]),
                ),
              ]),
            ),
          ]),
        ),
      ]),
    ]),
  );

  const paramDecorator = builders.decorator(
    builders.callExpression(builders.identifier("swagger.ApiParam"), [
      builders.objectExpression([
        builders.property(
          "init",
          builders.identifier("name"),
          builders.literal("id"),
        ),
        builders.property(
          "init",
          builders.identifier("type"),
          builders.literal("string"),
        ),
        builders.property(
          "init",
          builders.identifier("required"),
          builders.literal(true),
        ),
      ]),
    ]),
  );

  const createdResponseDecorator = builders.decorator(
    builders.callExpression(builders.identifier("swagger.ApiCreatedResponse"), [
      builders.objectExpression([
        builders.property(
          "init",
          builders.identifier("type"),
          builders.identifier(pascalCase(entityId.name)),
        ),
        builders.property(
          "init",
          builders.identifier("status"),
          builders.literal("2XX"),
        ),
      ]),
    ]),
  );

  return builders.classMethod.from({
    async: true,
    key: methodId,
    params: params,
    decorators: [
      putDecorator,
      interceptorDecorator,
      consumesDecorator,
      bodyDecorator,
      paramDecorator,
      createdResponseDecorator,
      swaggerApiNotFoundResponseDecorator,
    ],
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
        builders.callExpression(
          builders.memberExpression(
            builders.identifier("this.service"),
            builders.identifier(`upload${pascalCase(name)}`),
          ),
          [
            builders.objectExpression([
              builders.property(
                "init",
                builders.identifier("where"),
                builders.identifier("params"),
              ),
            ]),
            builders.callExpression(builders.identifier("Object.assign"), [
              builders.identifier("file"),
              builders.objectExpression([
                builders.property(
                  "init",
                  builders.identifier("filename"),
                  builders.memberExpression(
                    builders.identifier("file"),
                    builders.identifier("originalname"),
                  ),
                ),
              ]),
            ]),
          ],
        ),
      ),
    ]),
  });
};

const getDeleteMethod = (
  params: namedTypes.Identifier[],
  methodId: namedTypes.Identifier,
  entityId: namedTypes.Identifier,
  name: string,
) => {
  const deleteDecorator = builders.decorator(
    builders.callExpression(builders.identifier("common.Delete"), [
      builders.literal(`:id/${name}`),
    ]),
  );

  const swaggerApiOkResponseDecorator = builders.decorator(
    builders.callExpression(builders.identifier("swagger.ApiOkResponse"), [
      builders.objectExpression([
        builders.property(
          "init",
          builders.identifier("type"),
          builders.identifier(pascalCase(entityId.name)),
        ),
      ]),
    ]),
  );

  return builders.classMethod.from({
    async: true,
    key: methodId,
    params: params,
    returnType: builders.tsTypeAnnotation(
      builders.tsTypeReference(
        builders.identifier("Promise"),
        builders.tsTypeParameterInstantiation([
          builders.tsTypeReference(entityId),
        ]),
      ),
    ),
    decorators: [
      deleteDecorator,
      swaggerApiOkResponseDecorator,
      swaggerApiNotFoundResponseDecorator,
    ],
    body: builders.blockStatement([
      builders.returnStatement(
        builders.callExpression(
          builders.memberExpression(
            builders.identifier("this.service"),
            builders.identifier(`delete${pascalCase(name)}`),
          ),
          [
            builders.objectExpression([
              builders.property(
                "init",
                builders.identifier("where"),
                builders.identifier("params"),
              ),
            ]),
          ],
        ),
      ),
    ]),
  });
};
