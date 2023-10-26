import {
  CreateEntityControllerBaseParams,
  DsgContext,
  Entity,
  EntityField,
  EnumDataType,
  LookupResolvedProperties,
  Module,
  types,
} from "@amplication/code-gen-types";
import {
  controllerMethodsIdsActionPairs,
  controllerToManyMethodsIdsActionPairs,
  EnumMessageType,
  manyRelationMethodMessages,
  methodMessages,
} from "./create-method-id-action-entity-map";
import {
  Message,
  Method,
  ScalarField,
  ObjectField,
  createScalarField,
  createObjectField,
  createMessage,
} from "protobuf-dsl";
import * as ProtobufSchemaDSL from "protobuf-dsl";
import { pascalCase } from "pascal-case";

export async function createGrpcProtoFile(
  context: DsgContext,
  eventParams: CreateEntityControllerBaseParams,
  relatedEntities: EntityField[]
): Promise<Module> {
  const { entityName, templateMapping, entity } = eventParams;
  const { serverDirectories } = context;

  try {
    const methods: Method[] = [];
    const fields: Array<ScalarField | ObjectField> = [];

    const messages: Message[] = [];

    let countField = 1;
    entity.fields.forEach((field) => {
      const currentField = createProtobufSchemaFieldsHandler[field.dataType](
        field.name,
        countField,
        field
      );
      if (!currentField) return;
      fields.push(currentField);
      countField = countField + 1;
    });

    controllerMethodsIdsActionPairs(templateMapping, entity).forEach(
      ({ methodName, inputObjectName, outputObjectName }) => {
        const currentMethod = ProtobufSchemaDSL.createMethod(
          methodName,
          inputObjectName,
          outputObjectName
        );
        methods.push(currentMethod);
      }
    );

    methodMessages(entityName).forEach(({ name, enumMessageType }) => {
      const currentMessage = createProtobufMessagesHandler[enumMessageType](
        name,
        entityName,
        fields
      );
      if (!currentMessage) return;
      messages.push(currentMessage);
    });

    relatedEntities &&
      relatedEntities.forEach((entity) => {
        const manyRelationFields: Array<ScalarField | ObjectField> = [];
        const { relatedEntity, relatedField } =
          entity.properties as LookupResolvedProperties;

        if (relatedEntity.name.toLowerCase() === entityName.toLowerCase())
          return;

        let countField = 1;
        relatedEntity.fields.forEach((field: EntityField) => {
          const currentField = createProtobufSchemaFieldsHandler[
            field.dataType
          ](field?.name, countField, field);
          if (!currentField) return;
          manyRelationFields.push(currentField);
          countField = countField + 1;
        });

        manyRelationMethodMessages(relatedEntity.name).forEach(
          ({ name, enumMessageType }) => {
            const currentMessage = createProtobufMessagesHandler[
              enumMessageType
            ](name, entityName, manyRelationFields, relatedEntity);
            if (
              !currentMessage ||
              messages.find((m) => m.name === currentMessage.name)
            )
              return;
            messages.push(currentMessage);
          }
        );
        controllerToManyMethodsIdsActionPairs(
          relatedEntity,
          relatedField.name,
          pascalCase(entityName)
        ).forEach(({ methodName, inputObjectName, outputObjectName }) => {
          const currentMethod = ProtobufSchemaDSL.createMethod(
            methodName,
            inputObjectName,
            outputObjectName
          );

          methods.push(currentMethod);
        });
      });

    const protobufSchema = ProtobufSchemaDSL.createSchema(
      entityName,
      { name: `${pascalCase(entityName)}Service`, methods: methods },
      messages
    );

    const file = await ProtobufSchemaDSL.print(protobufSchema);

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

export type CreateMessageHandler = (
  messageName: string,
  entityName: string,
  fields: Array<ScalarField | ObjectField>,
  relatedEntity?: Entity
) => Message | null;

export const createProtobufMessagesHandler: {
  [key in EnumMessageType]: CreateMessageHandler;
} = {
  [EnumMessageType.Empty]: (
    messageName: string,
    entityName,
    fields: Array<ScalarField | ObjectField>
  ) => createMessage(messageName, []),

  [EnumMessageType.Create]: (
    messageName: string,
    entityName,
    fields: Array<ScalarField | ObjectField>
  ) => createMessage(messageName, fields),

  [EnumMessageType.EntityObject]: (
    messageName: string,
    entityName,
    fields: Array<ScalarField | ObjectField>
  ) => createMessage(messageName, fields),

  [EnumMessageType.EntityUpdateInput]: (
    messageName: string,
    entityName,
    fields: Array<ScalarField | ObjectField>
  ) => createMessage(messageName, fields),

  [EnumMessageType.EntityWhereInput]: (
    messageName: string,
    entityName,
    fields: Array<ScalarField | ObjectField>
  ) => createMessage(messageName, fields),

  [EnumMessageType.RelatedEntityObject]: (
    messageName: string,
    entityName,
    fields: Array<ScalarField | ObjectField>
  ) => createMessage(messageName, fields),

  [EnumMessageType.RelatedEntityWhereInputObject]: (
    messageName: string,
    entityName,
    fields: Array<ScalarField | ObjectField>
  ) => createMessage(messageName, fields),

  [EnumMessageType.CombineWhereUniqInput]: (
    messageName: string,
    entityName,
    fields: Array<ScalarField | ObjectField>,
    relatedEntity?: Entity
  ) => {
    if (!relatedEntity) return null;
    return createMessage(messageName, [
      createObjectField(
        `${entityName}WhereUniqueInput`,
        `${pascalCase(entityName)}WhereUniqueInput`,
        1,
        false
      ),
      createObjectField(
        `${relatedEntity.name.toLowerCase()}WhereUniqueInput`,
        `${relatedEntity.name}WhereUniqueInput`,
        2,
        false
      ),
    ]);
  },
};

export const createProtobufSchemaFieldsHandler: {
  [key in EnumDataType]: CreateSchemaFieldHandler;
} = {
  [EnumDataType.SingleLineText]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) => createScalarField(fieldName, "string", countField, false),
  [EnumDataType.MultiLineText]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) => createScalarField(fieldName, "string", countField, false),
  [EnumDataType.Email]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) => createScalarField(fieldName, "string", countField, false),
  [EnumDataType.WholeNumber]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) => createScalarField(fieldName, "int32", countField, false),
  [EnumDataType.DateTime]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) => createScalarField(fieldName, "string", countField, false),
  [EnumDataType.DecimalNumber]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) => createScalarField(fieldName, "int32", countField, false),
  [EnumDataType.Boolean]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) => createScalarField(fieldName, "bool", countField, false),
  [EnumDataType.GeographicLocation]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) => createScalarField(fieldName, "string", countField, false),
  [EnumDataType.Json]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) => createScalarField(fieldName, "string", countField, false),
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

    if (
      (allowMultipleSelection || isOneToOneWithoutForeignKey) &&
      relatedEntity != null
    ) {
      return createObjectField(
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
  ) => createScalarField(fieldName, "string", countField, true),
  [EnumDataType.OptionSet]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) => createScalarField(fieldName, "string", countField, true),
  [EnumDataType.Id]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) => {
    const { properties } = field;
    const idType = (properties as types.Id)?.idType ?? "CUID";

    return createScalarField(
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
  ) => createScalarField(fieldName, "string", countField, false),
  [EnumDataType.UpdatedAt]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) => createScalarField(fieldName, "string", countField, false),
  [EnumDataType.Roles]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) => createScalarField(fieldName, "json", countField, false),
  [EnumDataType.Username]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) => createScalarField(fieldName, "string", countField, false),

  [EnumDataType.Password]: (
    fieldName: string,
    countField: number,
    field: EntityField
  ) => createScalarField(fieldName, "string", countField, false),
};

export const idTypeToProtobufScalarType: {
  [key in types.Id["idType"]]: string;
} = {
  AUTO_INCREMENT: "int32",
  AUTO_INCREMENT_BIG_INT: "int32",
  CUID: "string",
  UUID: "string",
};
