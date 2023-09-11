import {
  AmplicationPlugin,
  CreatePrismaSchemaParams,
  CreateServerDockerComposeDBParams,
  CreateServerDockerComposeParams,
  CreateServerDotEnvParams,
  CreateServerParams,
  DsgContext,
  Entity,
  EntityField,
  EnumDataType,
  Events,
  LookupResolvedProperties,
  ModuleMap,
  types,
} from "@amplication/code-gen-types";
import { getPluginSettings } from "./utils";
import {
  dataSource,
  updateDockerComposeDevProperties,
  updateDockerComposeProperties,
} from "./constants";
import { ReferentialActions, ScalarType } from "prisma-schema-dsl-types";
import * as PrismaSchemaDSL from "prisma-schema-dsl";
import * as PrismaSchemaDSLTypes from "prisma-schema-dsl-types";
import { camelCase } from "camel-case";
import { pascalCase } from "pascal-case";

class MSSQLServerPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      CreateServer: {
        before: this.beforeCreateServer,
      },
      CreateServerDotEnv: {
        before: this.beforeCreateServerDotEnv,
      },
      CreateServerDockerCompose: {
        before: this.beforeCreateServerDockerCompose,
      },
      CreateServerDockerComposeDev: {
        before: this.beforeCreateServerDockerComposeDev,
      },
      CreatePrismaSchema: {
        before: this.beforeCreatePrismaSchema,
      },
    };
  }

  beforeCreateServer(context: DsgContext, eventParams: CreateServerParams) {
    const generateErrorMessageForEnums = (
      fieldType: string,
      entityName: string,
      fieldName: string
    ) => `${fieldType} (list of primitives type) on entity: ${entityName}, field: ${fieldName}, is not supported by SQL Server prisma provider. 
    You can select another data type or change your DB to PostgreSQL`;

    const generateErrorMessageForJson = (
      entityName: string,
      fieldName: string
    ) => `field type JSON on entity: ${entityName}, field: ${fieldName}, is not supported by SQL Server prisma provider. 
    You can select another data type or change your DB provider`;

    context.entities?.forEach(({ name: entityName, fields }) => {
      const enumField = fields.find(
        ({ dataType }) =>
          dataType === EnumDataType.MultiSelectOptionSet ||
          dataType === EnumDataType.OptionSet
      );
      if (enumField) {
        const errorMessage = generateErrorMessageForEnums(
          enumField.dataType as string,
          entityName,
          enumField.name
        );
        context.logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      const jsonField = fields.find(
        ({ dataType }) => dataType === EnumDataType.Json
      );
      if (jsonField) {
        const errorMessage = generateErrorMessageForJson(
          entityName,
          jsonField.name
        );
        context.logger.error(errorMessage);
        throw new Error(errorMessage);
      }
    });

    return eventParams;
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams
  ) {
    const { port, password, user, host, dbName } = getPluginSettings(
      context.pluginInstallations
    );

    eventParams.envVariables = [
      ...eventParams.envVariables,
      ...[
        { DB_USER: user },
        { DB_PASSWORD: password },
        { DB_PORT: port.toString() },
        { DB_NAME: dbName },
        {
          DB_URL: `sqlserver://${host}:${port};database=${dbName};user=${user};password=${password}`,
        },
      ],
    ];

    return eventParams;
  }

  beforeCreateServerDockerCompose(
    context: DsgContext,
    eventParams: CreateServerDockerComposeParams
  ) {
    eventParams.updateProperties.push(...updateDockerComposeProperties);
    return eventParams;
  }

  beforeCreateServerDockerComposeDev(
    context: DsgContext,
    eventParams: CreateServerDockerComposeDBParams
  ) {
    eventParams.updateProperties.push(...updateDockerComposeDevProperties);
    return eventParams;
  }

  beforeCreatePrismaSchema(
    context: DsgContext,
    eventParams: CreatePrismaSchemaParams
  ) {
    const { entities } = eventParams;
    entities.forEach((entity) => {
      entity.fields.forEach((field) => {
        if (field.customAttributes) {
          field.customAttributes = field.customAttributes.replace(
            /@([\w]+)\./g,
            `@${dataSource.name}.`
          );
        }
      });
    });

    eventParams.createFieldsHandlers[EnumDataType.Lookup] = (
      field: EntityField,
      entity: Entity,
      fieldNamesCount: Record<string, number> = {}
    ) => {
      const { name, properties } = field;
      const {
        relatedEntity,
        relatedField,
        allowMultipleSelection,
        isOneToOneWithoutForeignKey,
      } = properties as LookupResolvedProperties;
      const hasAnotherRelation = entity.fields.some(
        (entityField) =>
          entityField.id !== field.id &&
          entityField.dataType === EnumDataType.Lookup &&
          entityField.properties.relatedEntity.name === relatedEntity.name
      );

      const relationName = !hasAnotherRelation
        ? null
        : MSSQLServerPlugin.createRelationName(
            entity,
            field,
            relatedEntity,
            relatedField,
            fieldNamesCount[field.name] === 1,
            fieldNamesCount[relatedField.name] === 1
          );

      if (allowMultipleSelection || isOneToOneWithoutForeignKey) {
        return [
          PrismaSchemaDSL.createObjectField(
            name,
            relatedEntity.name,
            !isOneToOneWithoutForeignKey,
            allowMultipleSelection || false,
            relationName,
            undefined,
            undefined,
            ReferentialActions.NoAction,
            ReferentialActions.NoAction
          ),
        ];
      }

      const scalarRelationFieldName = field.properties.fkFieldName;

      const relatedEntityFiledId = relatedEntity.fields?.find(
        (relatedEntityField) => relatedEntityField.dataType === EnumDataType.Id
      );

      const idType =
        (relatedEntityFiledId?.properties as types.Id)?.idType ?? "CUID";

      return [
        PrismaSchemaDSL.createObjectField(
          name,
          relatedEntity.name,
          false,
          field.required,
          relationName,
          [scalarRelationFieldName],
          [
            "id",
          ] /**@todo: calculate the referenced field on the related entity (currently it is always 'id') */,
          ReferentialActions.NoAction,
          ReferentialActions.NoAction,
          undefined,
          field.customAttributes || undefined 
        ),
        // Prisma Scalar Relation Field
        PrismaSchemaDSL.createScalarField(
          scalarRelationFieldName,
          MSSQLServerPlugin.idTypeToPrismaScalarType[idType],
          false,
          field.required,
          !field.properties.allowMultipleSelection &&
            !relatedField?.properties.allowMultipleSelection &&
            !isOneToOneWithoutForeignKey
            ? true
            : field.unique,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          field.customAttributes || undefined
        ),
      ];
    };

    return {
      ...eventParams,
      dataSource: dataSource,
    };
  }

  /**
   * Creates Prisma Schema relation name according to the names of the entity,
   * field, relatedEntity and relatedField.
   * This function is assumed to be used when a relation name is necessary
   * @param entity
   * @param field
   * @param relatedEntity
   * @param relatedField
   * @param fieldHasUniqueName
   * @returns Prisma Schema relation name
   * @todo use unique name of one of the fields deterministically (VIPCustomers or VIPOrganizations)
   */
  private static createRelationName(
    entity: Entity,
    field: EntityField,
    relatedEntity: Entity,
    relatedField: EntityField,
    fieldHasUniqueName: boolean,
    relatedFieldHasUniqueName: boolean
  ): string {
    const relatedEntityNames = [
      relatedEntity.name,
      pascalCase(relatedEntity.pluralName),
    ];
    const entityNames = [entity.name, pascalCase(entity.pluralName)];
    const matchingRelatedEntityName = relatedEntityNames.find(
      (name) => field.name === camelCase(name)
    );
    const matchingEntityName = entityNames.find(
      (name) => relatedField.name === camelCase(name)
    );
    if (matchingRelatedEntityName && matchingEntityName) {
      const names = [matchingRelatedEntityName, matchingEntityName];
      // Sort names for deterministic results regardless of entity and related order
      names.sort();
      return names.join("On");
    }
    if (fieldHasUniqueName || relatedFieldHasUniqueName) {
      const names = [];
      if (fieldHasUniqueName) {
        names.push(field.name);
      }
      if (relatedFieldHasUniqueName) {
        names.push(relatedField.name);
      }
      // Sort names for deterministic results regardless of entity and related order
      names.sort();
      return names[0];
    }
    const entityAndField = [entity.name, field.name].join(" ");
    const relatedEntityAndField = [relatedEntity.name, relatedField.name].join(
      " "
    );
    const parts = [entityAndField, relatedEntityAndField];
    // Sort parts for deterministic results regardless of entity and related order
    parts.sort();
    return pascalCase(parts.join(" "));
  }

  private static idTypeToPrismaScalarType: {
    [key in types.Id["idType"]]: PrismaSchemaDSLTypes.ScalarType;
  } = {
    AUTO_INCREMENT: PrismaSchemaDSLTypes.ScalarType.Int,
    AUTO_INCREMENT_BIG_INT: PrismaSchemaDSLTypes.ScalarType.BigInt,
    CUID: PrismaSchemaDSLTypes.ScalarType.String,
    UUID: PrismaSchemaDSLTypes.ScalarType.String,
  };
}

export default MSSQLServerPlugin;
