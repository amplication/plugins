import {
  CreateEntityControllerBaseParams,
  DsgContext,
  EntityField,
  EnumDataType,
  LookupResolvedProperties,
  Module,
  types,
} from "@amplication/code-gen-types";
import { controllerMethodsIdsActionPairs } from "./create-method-id-action-entity-map";
import {
  print,
  Message,
  Method,
  ScalarField,
  ScalarType,
  ObjectField,
} from "protobuf-dsl";
import * as ProtobufSchemaDSL from "protobuf-dsl";

export async function createGrpcProtoFile(
  context: DsgContext,
  eventParams: CreateEntityControllerBaseParams,
  relatedEntities: EntityField[]
): Promise<Module> {
  try {
    const { entityName, controllerBaseId, templateMapping, entity } =
      eventParams;
    const { serverDirectories } = context;

    const methods: Method[] = [];
    const fields: Array<ScalarField | ObjectField> = [];
    const messages: Message[] = [];
    console.log("entities fields: ", entity)

    controllerMethodsIdsActionPairs(templateMapping, entity).forEach(
      ({ methodName, inputObjectName, outputObjectName }) => {
        const currentMethod = ProtobufSchemaDSL.createMethod(
          methodName,
          inputObjectName,
          outputObjectName
        );

        methods.push(currentMethod);

        entity.fields.forEach((field) => {
          console.log({field});
          let countField = 1;
          const currentField = createProtobufSchemaFieldsHandler[
            field.dataType
          ](field.name, countField, field);
          currentField && fields.push(currentField);
          countField = +1;
          console.log({currentField});
        });

        messages.push(ProtobufSchemaDSL.createMessage(inputObjectName, fields));
        messages.push(
          ProtobufSchemaDSL.createMessage(outputObjectName, fields)
        );
      }
    );

    const protobufSchema = ProtobufSchemaDSL.createSchema(
      { name: entityName, methods: methods },
      messages
    );

    const file = await print(protobufSchema);

    // relatedEntities &&
    //   relatedEntities.forEach((entity) => {
    //     controllerToManyMethodsIdsActionPairs(pascalCase(entity.name)).forEach(
    //       ({ methodId, methodName }) => {
    //         const classMethod = getClassMethodByIdName(
    //           classDeclaration,
    //           methodId
    //         );
    //         classMethod?.decorators?.push(
    //           buildGrpcMethodDecorator(entity.name, methodName)
    //         );
    //       }
    //     );
    //   });

    const fileName = `${entityName}.proto`;

    const filePath = `${serverDirectories.srcDirectory}/${entityName}/${fileName}`;

    return {
      code: file,
      path: filePath,
    };
  } catch (error) {
    console.error(error);
    return { code: "", path: "" };
  }
}

export type CreateSchemaFieldHandler = (
  fieldName: string,
  countField: number,
  field: EntityField
) => ScalarField | ObjectField | null;

export const createProtobufSchemaFieldsHandler: {
  [key in EnumDataType]: CreateSchemaFieldHandler;
} = {
  [EnumDataType.SingleLineText]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) =>
    ProtobufSchemaDSL.createScalarField(
      fieldName,
      ScalarType.String,
      countField,
      false
    ),
  [EnumDataType.MultiLineText]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) =>
    ProtobufSchemaDSL.createScalarField(
      fieldName,
      ScalarType.String,
      countField,
      false
    ),
  [EnumDataType.Email]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) =>
    ProtobufSchemaDSL.createScalarField(
      fieldName,
      ScalarType.String,
      countField,
      false
    ),
  [EnumDataType.WholeNumber]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) =>
    ProtobufSchemaDSL.createScalarField(
      fieldName,
      ScalarType.Int,
      countField,
      false
    ),
  [EnumDataType.DateTime]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) =>
    ProtobufSchemaDSL.createScalarField(
      fieldName,
      ScalarType.DateTime,
      countField,
      false
    ),
  [EnumDataType.DecimalNumber]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) =>
    ProtobufSchemaDSL.createScalarField(
      fieldName,
      ScalarType.Float,
      countField,
      false
    ),
  [EnumDataType.Boolean]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) =>
    ProtobufSchemaDSL.createScalarField(
      fieldName,
      ScalarType.Boolean,
      countField,
      false
    ),
  [EnumDataType.GeographicLocation]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) =>
    ProtobufSchemaDSL.createScalarField(
      fieldName,
      ScalarType.String,
      countField,
      false
    ),
  [EnumDataType.Json]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) =>
    ProtobufSchemaDSL.createScalarField(
      fieldName,
      ScalarType.Json,
      countField,
      false
    ),
  [EnumDataType.Lookup]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) => {
    const { properties } = field;
    const {
      relatedEntity,
      relatedField,
      allowMultipleSelection,
      isOneToOneWithoutForeignKey,
    } = properties as LookupResolvedProperties;

    if (allowMultipleSelection || isOneToOneWithoutForeignKey) {
      return ProtobufSchemaDSL.createObjectField(
        fieldName,
        relatedEntity.name,
        countField,
        !isOneToOneWithoutForeignKey
      );
    }

    return null;
  },
  [EnumDataType.MultiSelectOptionSet]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) =>
    ProtobufSchemaDSL.createScalarField(
      fieldName,
      ScalarType.String,
      countField,
      true
    ),
  [EnumDataType.OptionSet]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) =>
    ProtobufSchemaDSL.createScalarField(
      fieldName,
      ScalarType.String,
      countField,
      true
    ),
  [EnumDataType.Id]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) => {
    const { properties } = field;
    const idType = (properties as types.Id)?.idType ?? "CUID";

    return ProtobufSchemaDSL.createScalarField(
      fieldName,
      idTypeToProtobufScalarType[idType],
      countField,
      false
    );
  },
  [EnumDataType.CreatedAt]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) =>
    ProtobufSchemaDSL.createScalarField(
      fieldName,
      ScalarType.DateTime,
      countField,
      false
    ),
  [EnumDataType.UpdatedAt]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) =>
    ProtobufSchemaDSL.createScalarField(
      fieldName,
      ScalarType.DateTime,
      countField,
      false
    ),
  [EnumDataType.Roles]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) =>
    ProtobufSchemaDSL.createScalarField(
      fieldName,
      ScalarType.Json,
      countField,
      false
    ),
  [EnumDataType.Username]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) =>
    ProtobufSchemaDSL.createScalarField(
      fieldName,
      ScalarType.String,
      countField,
      false
    ),

  [EnumDataType.Password]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) =>
    ProtobufSchemaDSL.createScalarField(
      fieldName,
      ScalarType.String,
      countField,
      false
    ),
};

export const idTypeToProtobufScalarType: {
  [key in types.Id["idType"]]: ScalarType;
} = {
  AUTO_INCREMENT: ScalarType.Int,
  AUTO_INCREMENT_BIG_INT: ScalarType.Int,
  CUID: ScalarType.String,
  UUID: ScalarType.String,
};
