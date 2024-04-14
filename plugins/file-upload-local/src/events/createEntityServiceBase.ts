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

/*
  async uploadProfilePicture<T extends Prisma.UserFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserFindUniqueArgs>,
    file: FileUpload,
  ): Promise<PrismaUser> {
    file.filename = `profilePicture-${args.where.id}.${file.filename.split(".").pop()}`;
    const containerPath = 'profilePictures';

    const profilePicture = await this.localStorageService.uploadFile(file, ["image"], 1000000, containerPath);
    return this.prisma.user.update({
      where: args.where,
      data: {
        profilePicture: profilePicture as InputJsonValue,
      },
    });
  }
*/

const getUploadFunction = (entityName: string, field: EntityField) => {
  const fieldName = field.name;

  const { properties } = field;

  const pascalEntityName = builders.identifier(entityName);
  const pascalFieldName = builders.identifier(fieldName);
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
        builders.templateLiteral(
          [
            builders.templateElement(
              { raw: `${fieldName}-`, cooked: `${fieldName}-` },
              false,
            ),
            builders.templateElement({ raw: ".", cooked: "." }, true),
            builders.templateElement(
              {
                raw: '${args.where.id}.${file.filename.split(".").pop()}',
                cooked: '${args.where.id}.${file.filename.split(".").pop()}',
              },
              false,
            ),
          ],
          [],
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
                  ),
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
                      pascalFieldName,
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
  const pascalEntityName = builders.identifier(entityName);
  const pascalFieldName = builders.identifier(fieldName);
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
    body: builders.blockStatement([
      builders.variableDeclaration("const", [
        builders.variableDeclarator(
          builders.objectPattern([
            builders.property("init", camelCaseFieldName, camelCaseFieldName),
          ]),
          builders.awaitExpression(
            builders.callExpression(
              builders.memberExpression(
                builders.memberExpression(
                  builders.thisExpression(),
                  builders.identifier("prisma"),
                ),
                builders.identifier(camelCaseEntityName.name),
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
                camelCaseFieldName,
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
                      pascalFieldName,
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
  const pascalEntityName = builders.identifier(entityName);
  const pascalFieldName = builders.identifier(fieldName);
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
    body: builders.blockStatement([
      builders.variableDeclaration("const", [
        builders.variableDeclarator(
          builders.objectPattern([
            builders.property("init", camelCaseFieldName, camelCaseFieldName),
          ]),
          builders.awaitExpression(
            builders.callExpression(
              builders.memberExpression(
                builders.memberExpression(
                  builders.thisExpression(),
                  builders.identifier("prisma"),
                ),
                builders.identifier(camelCaseEntityName.name),
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
                camelCaseFieldName,
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
