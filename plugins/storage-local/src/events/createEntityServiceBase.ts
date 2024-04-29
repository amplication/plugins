import {
  CreateEntityServiceBaseParams,
  DsgContext,
  EntityField,
  EnumDataType,
} from "@amplication/code-gen-types";
import {
  addImports,
  addInjectableDependency,
  getClassDeclarationById,
  importNames,
  interpolate,
} from "../util/ast";
import { STORAGE_SERVICE_ID, STORAGE_SERVICE_MEMBER_ID } from "../constants";
import { builders } from "ast-types";
import { camelCase } from "lodash";
import { pascalCase } from "pascal-case";

export const beforeCreateEntityServiceBase = async (
  context: DsgContext,
  eventParams: CreateEntityServiceBaseParams,
) => {
  const { entity, template, templateMapping, serviceBaseId } = eventParams;

  const fileFields = entity.fields.filter(
    (field) => field.dataType === EnumDataType.File,
  );

  if (fileFields.length === 0) {
    return eventParams;
  }

  interpolate(template, templateMapping);

  const classDeclaration = getClassDeclarationById(template, serviceBaseId);

  addInjectableDependency(
    classDeclaration,
    STORAGE_SERVICE_MEMBER_ID.name,
    STORAGE_SERVICE_ID,
    "protected",
  );

  const importArray = [
    importNames(
      [STORAGE_SERVICE_ID],
      "src/storage/providers/local/local.storage.service",
    ),
    importNames([builders.identifier("InputJsonValue")], "src/types"),
    importNames(
      [builders.identifier("FileDownload"), builders.identifier("FileUpload")],
      "src/storage/base/storage.types",
    ),
    importNames(
      [builders.identifier("LocalStorageFile")],
      "src/storage/providers/local/local.storage.types",
    ),
  ];

  addImports(template, importArray);

  fileFields.forEach((field) => {
    classDeclaration.body.body.push(
      getUploadFunction(entity.name, field),
      getDownloadFunction(entity.name, field.name),
      getDeleteFunction(entity.name, field.name),
    );
  });

  return eventParams;
};

const getUploadFunction = (entityName: string, field: EntityField) => {
  const fieldName = field.name;

  const { properties } = field;

  const pascalEntityName = builders.identifier(pascalCase(entityName));
  const pascalFieldName = builders.identifier(pascalCase(fieldName));
  const camelCaseEntityName = builders.identifier(camelCase(entityName));
  const camelCaseFieldName = builders.identifier(camelCase(fieldName));

  const args = builders.identifier("args");
  args.typeAnnotation = builders.tsTypeAnnotation(
    builders.tsTypeReference(
      builders.identifier("Prisma.SelectSubset"),
      builders.tsTypeParameterInstantiation([
        builders.tsTypeReference(builders.identifier("T")),
        builders.tsTypeReference(
          builders.identifier(`Prisma.${pascalEntityName.name}FindUniqueArgs`),
        ),
      ]),
    ),
  );

  const file = builders.identifier("file");
  file.typeAnnotation = builders.tsTypeAnnotation(
    builders.tsTypeReference(builders.identifier("FileUpload")),
  );

  const initialReassignmentStatement = [
    builders.expressionStatement(
      builders.assignmentExpression(
        "=",
        builders.memberExpression(
          builders.identifier("file"),
          builders.identifier("filename"),
        ),
        // `profilePicture-${args.where.id}.${file.filename.split(".").pop()}`;
        builders.templateLiteral(
          [
            builders.templateElement(
              {
                raw: "profilePicture-",
                cooked: "profilePicture-",
              },
              false,
            ),
            builders.templateElement(
              {
                raw: ".",
                cooked: ".",
              },
              false,
            ),
            builders.templateElement(
              {
                raw: "",
                cooked: "",
              },
              true,
            ),
          ],
          [
            builders.memberExpression(
              builders.memberExpression(
                builders.identifier("args"),
                builders.identifier("where"),
              ),
              builders.identifier("id"),
            ),
            builders.callExpression(
              builders.memberExpression(
                builders.memberExpression(
                  builders.memberExpression(
                    builders.identifier("file"),
                    builders.identifier("filename"),
                  ),
                  builders.callExpression(builders.identifier("split"), [
                    builders.stringLiteral("."),
                  ]),
                ),
                builders.identifier("pop"),
              ),
              [],
            ),
          ],
        ),
      ),
    ),
    builders.variableDeclaration("const", [
      builders.variableDeclarator(
        builders.identifier("containerPath"),
        builders.stringLiteral(properties?.containerPath || fieldName),
      ),
    ]),
  ];

  return builders.classMethod.from({
    async: true,
    kind: "method",
    key: builders.identifier(`upload${pascalFieldName.name}`),
    params: [args, file],
    returnType: builders.tsTypeAnnotation(
      builders.tsTypeReference(
        builders.identifier(`Promise<Prisma${pascalEntityName.name}>`),
      ),
    ),
    typeParameters: builders.tsTypeParameterDeclaration.from({
      params: [
        builders.tsTypeParameter.from({
          name: "T",
          constraint: builders.tsTypeReference(
            builders.identifier(
              `Prisma.${pascalEntityName.name}FindUniqueArgs`,
            ),
          ),
        }),
      ],
    }),
    body: builders.blockStatement([
      ...initialReassignmentStatement,
      builders.variableDeclaration("const", [
        builders.variableDeclarator(
          builders.identifier(camelCaseFieldName.name),
          builders.awaitExpression(
            builders.callExpression(
              builders.memberExpression(
                builders.memberExpression(
                  builders.thisExpression(),
                  builders.identifier("localStorageService"),
                ),
                builders.identifier("uploadFile"),
              ),
              [
                builders.identifier("file"),
                builders.arrayExpression(
                  properties?.allowedFileTypes?.map((mimeType: string) =>
                    builders.stringLiteral(mimeType),
                  ) || [],
                ),
                builders.numericLiteral(properties?.maxFileSize || 1000000),
                builders.identifier("containerPath"),
              ],
            ),
          ),
        ),
      ]),
      builders.returnStatement(
        builders.awaitExpression(
          builders.callExpression(
            builders.memberExpression(
              builders.memberExpression(
                builders.thisExpression(),
                builders.identifier("prisma"),
              ),
              builders.identifier(`${camelCaseEntityName.name}.update`),
            ),
            [
              builders.objectExpression([
                builders.property(
                  "init",
                  builders.identifier("where"),
                  builders.identifier("args.where"),
                ),
                builders.property(
                  "init",
                  builders.identifier("data"),
                  builders.objectExpression([
                    builders.property(
                      "init",
                      camelCaseFieldName,
                      builders.tsAsExpression(
                        camelCaseFieldName,
                        builders.tsTypeReference(
                          builders.identifier("InputJsonValue"),
                        ),
                      ),
                    ),
                  ]),
                ),
              ]),
            ],
          ),
        ),
      ),
    ]),
  });
};

const getDeleteFunction = (entityName: string, fieldName: string) => {
  const pascalEntityName = builders.identifier(pascalCase(entityName));
  const pascalFieldName = builders.identifier(pascalCase(fieldName));
  const camelCaseEntityName = builders.identifier(camelCase(entityName));
  const camelCaseFieldName = builders.identifier(camelCase(fieldName));

  const args = builders.identifier("args");
  args.typeAnnotation = builders.tsTypeAnnotation(
    builders.tsTypeReference(
      builders.identifier("Prisma.SelectSubset"),
      builders.tsTypeParameterInstantiation([
        builders.tsTypeReference(builders.identifier("T")),
        builders.tsTypeReference(
          builders.identifier(`Prisma.${pascalEntityName.name}FindUniqueArgs`),
        ),
      ]),
    ),
  );

  return builders.classMethod.from({
    async: true,
    kind: "method",
    key: builders.identifier(`delete${pascalFieldName.name}`),
    params: [args],
    returnType: builders.tsTypeAnnotation(
      builders.tsTypeReference(
        builders.identifier(`Promise<Prisma${pascalEntityName.name}>`),
      ),
    ),
    typeParameters: builders.tsTypeParameterDeclaration.from({
      params: [
        builders.tsTypeParameter.from({
          name: "T",
          constraint: builders.tsTypeReference(
            builders.identifier(
              `Prisma.${pascalEntityName.name}FindUniqueArgs`,
            ),
          ),
        }),
      ],
    }),
    body: builders.blockStatement([
      builders.variableDeclaration("const", [
        builders.variableDeclarator(
          builders.objectPattern([
            builders.property.from({
              key: camelCaseFieldName,
              kind: "init",
              value: camelCaseFieldName,
              shorthand: true,
            }),
          ]),
          builders.awaitExpression(
            builders.callExpression(
              builders.memberExpression(
                builders.memberExpression(
                  builders.memberExpression(
                    builders.thisExpression(),
                    builders.identifier("prisma"),
                  ),
                  builders.identifier(camelCaseEntityName.name),
                ),
                builders.identifier("findUniqueOrThrow"),
              ),
              [
                builders.objectExpression([
                  builders.property(
                    "init",
                    builders.identifier("where"),
                    builders.identifier("args.where"),
                  ),
                ]),
              ],
            ),
          ),
        ),
      ]),
      builders.expressionStatement(
        builders.awaitExpression(
          builders.callExpression(
            builders.memberExpression(
              builders.memberExpression(
                builders.thisExpression(),
                builders.identifier("localStorageService"),
              ),
              builders.identifier("deleteFile"),
            ),
            [
              builders.tsAsExpression(
                builders.tsAsExpression(
                  camelCaseFieldName,
                  builders.tsUnknownKeyword(),
                ),
                builders.tsTypeReference(
                  builders.identifier("LocalStorageFile"),
                ),
              ),
            ],
          ),
        ),
      ),
      builders.returnStatement(
        builders.awaitExpression(
          builders.callExpression(
            builders.memberExpression(
              builders.memberExpression(
                builders.thisExpression(),
                builders.identifier("prisma"),
              ),
              builders.identifier(`${camelCaseEntityName.name}.update`),
            ),
            [
              builders.objectExpression([
                builders.property(
                  "init",
                  builders.identifier("where"),
                  builders.identifier("args.where"),
                ),
                builders.property(
                  "init",
                  builders.identifier("data"),
                  builders.objectExpression([
                    builders.property(
                      "init",
                      camelCaseFieldName,
                      builders.identifier("Prisma.DbNull"),
                    ),
                  ]),
                ),
              ]),
            ],
          ),
        ),
      ),
    ]),
  });
};

const getDownloadFunction = (entityName: string, fieldName: string) => {
  const pascalEntityName = builders.identifier(pascalCase(entityName));
  const pascalFieldName = builders.identifier(pascalCase(fieldName));
  const camelCaseEntityName = builders.identifier(camelCase(entityName));
  const camelCaseFieldName = builders.identifier(camelCase(fieldName));

  const args = builders.identifier("args");
  args.typeAnnotation = builders.tsTypeAnnotation(
    builders.tsTypeReference(
      builders.identifier("Prisma.SelectSubset"),
      builders.tsTypeParameterInstantiation([
        builders.tsTypeReference(builders.identifier("T")),
        builders.tsTypeReference(
          builders.identifier(`Prisma.${pascalEntityName.name}FindUniqueArgs`),
        ),
      ]),
    ),
  );

  return builders.classMethod.from({
    async: true,
    kind: "method",
    key: builders.identifier(`download${pascalFieldName.name}`),
    params: [args],
    returnType: builders.tsTypeAnnotation(
      builders.tsTypeReference(builders.identifier("Promise<FileDownload>")),
    ),
    typeParameters: builders.tsTypeParameterDeclaration.from({
      params: [
        builders.tsTypeParameter.from({
          name: "T",
          constraint: builders.tsTypeReference(
            builders.identifier(
              `Prisma.${pascalEntityName.name}FindUniqueArgs`,
            ),
          ),
        }),
      ],
    }),
    body: builders.blockStatement([
      builders.variableDeclaration("const", [
        builders.variableDeclarator(
          builders.objectPattern([
            builders.property.from({
              key: camelCaseFieldName,
              kind: "init",
              value: camelCaseFieldName,
              shorthand: true,
            }),
          ]),
          builders.awaitExpression(
            builders.callExpression(
              builders.memberExpression(
                builders.memberExpression(
                  builders.memberExpression(
                    builders.thisExpression(),
                    builders.identifier("prisma"),
                  ),
                  builders.identifier(camelCaseEntityName.name),
                ),
                builders.identifier("findUniqueOrThrow"),
              ),
              [
                builders.objectExpression([
                  builders.property(
                    "init",
                    builders.identifier("where"),
                    builders.identifier("args.where"),
                  ),
                ]),
              ],
            ),
          ),
        ),
      ]),
      builders.returnStatement(
        builders.awaitExpression(
          builders.callExpression(
            builders.memberExpression(
              builders.memberExpression(
                builders.thisExpression(),
                builders.identifier("localStorageService"),
              ),
              builders.identifier("downloadFile"),
            ),
            [
              builders.tsAsExpression(
                builders.tsAsExpression(
                  camelCaseFieldName,
                  builders.tsUnknownKeyword(),
                ),
                builders.tsTypeReference(
                  builders.identifier("LocalStorageFile"),
                ),
              ),
            ],
          ),
        ),
      ),
    ]),
  });
};
