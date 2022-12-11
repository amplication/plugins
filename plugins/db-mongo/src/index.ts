import { resolve } from "path";
import {
  dataSource,
  envVariables,
  updateDockerComposeProperties,
} from "./constants";
import {
  DsgContext,
  AmplicationPlugin,
  CreateServerDockerComposeDBParams,
  CreateServerDockerComposeParams,
  CreateServerDotEnvParams,
  CreatePrismaSchemaParams,
  Events,
  EnumDataType,
  EntityField,
  Entity,
  LookupResolvedProperties,
  CreateSchemaFieldResult,
  CreateServerPackageJsonParams,
  CreateServerParams,
  types,
} from "@amplication/code-gen-types";
import { ScalarType, ReferentialActions } from "prisma-schema-dsl-types";
import * as PrismaSchemaDSL from "prisma-schema-dsl";
import { camelCase } from "camel-case";
import { pascalCase } from "pascal-case";

class MongoPlugin implements AmplicationPlugin {
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
      CreateServerDockerComposeDB: {
        before: this.beforeCreateServerDockerComposeDB,
        after: this.afterCreateServerDockerComposeDB,
      },
      CreatePrismaSchema: {
        before: this.beforeCreatePrismaSchema,
      },
      CreateServerPackageJson: {
        before: this.beforeCreateServerPackageJson,
        after: this.afterCreateServerPackageJson,
      },
    };
  }

  beforeCreateServer(context: DsgContext, eventParams: CreateServerParams) {
    const generateErrorMessage =
      () => `The ID type: "Auto increment" is not supported by MongoDB Prisma provider. 
          To use MongoDB, You need to select another ID type for your entities`;

    context.entities?.forEach(({ fields }) => {
      const field = fields.find((field) => field.dataType === EnumDataType.Id);

      const { idType } = (field?.properties as types.Id) || "CUID";

      if (idType === "AUTO_INCREMENT") {
        context.logger.error(generateErrorMessage());
        context.utils.abortGeneration(generateErrorMessage());
      }
    });

    return eventParams;
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams
  ) {
    context.utils.skipDefaultBehavior = true;
    return eventParams;
  }

  async afterCreateServerPackageJson(context: DsgContext) {
    const staticPath = resolve(__dirname, "../static/package-json");
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.baseDirectory
    );

    return staticsFiles;
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams
  ) {
    eventParams.envVariables = [...eventParams.envVariables, ...envVariables];

    return eventParams;
  }

  beforeCreateServerDockerCompose(
    context: DsgContext,
    eventParams: CreateServerDockerComposeParams
  ) {
    eventParams.updateProperties.push(...updateDockerComposeProperties);
    return eventParams;
  }

  beforeCreateServerDockerComposeDB(
    context: DsgContext,
    eventParams: CreateServerDockerComposeDBParams
  ) {
    context.utils.skipDefaultBehavior = true;
    return eventParams;
  }

  async afterCreateServerDockerComposeDB(context: DsgContext) {
    const staticPath = resolve(__dirname, "../static/docker-compose");
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.baseDirectory
    );

    return staticsFiles;
  }

  beforeCreatePrismaSchema(
    context: DsgContext,
    eventParams: CreatePrismaSchemaParams
  ) {
    const originalHandler =
      eventParams.createFieldsHandlers[EnumDataType.Lookup];

    eventParams.createFieldsHandlers[EnumDataType.Lookup] = (
      field: EntityField,
      entity: Entity,
      fieldNamesCount?: Record<string, number>
    ): CreateSchemaFieldResult => {
      const { properties, name } = field;
      const {
        relatedEntity,
        allowMultipleSelection,
        relatedField,
        isOneToOneWithoutForeignKey,
      } = properties as LookupResolvedProperties;

      const hasManyToManyRelation = relatedEntity.fields.some(
        (entityField) =>
          entityField.id !== field.id &&
          entityField.dataType === EnumDataType.Lookup &&
          entityField.permanentId === field.properties?.relatedFieldId &&
          allowMultipleSelection &&
          entityField.properties?.allowMultipleSelection
      );

      if (hasManyToManyRelation) {
        const hasAnotherRelation = entity.fields.some(
          (entityField) =>
            entityField.id !== field.id &&
            entityField.dataType === EnumDataType.Lookup &&
            entityField.properties.relatedEntity.name === relatedEntity.name
        );

        const isSelfRelation = relatedEntity.name === entity.name;

        const relationName = !hasAnotherRelation
          ? null
          : this.createRelationName(
              entity,
              field,
              relatedEntity,
              relatedField,
              fieldNamesCount ? fieldNamesCount[field.name] === 1 : false,
              fieldNamesCount ? fieldNamesCount[relatedField.name] === 1 : false
            );

        const scalarRelationFieldName = `${name}Ids`;
        return [
          PrismaSchemaDSL.createObjectField(
            name,
            relatedEntity.name,
            true,
            true || field.required,
            relationName,
            [scalarRelationFieldName],
            ["id"],
            isSelfRelation
              ? ReferentialActions.NoAction
              : ReferentialActions.NONE,
            isSelfRelation
              ? ReferentialActions.NoAction
              : ReferentialActions.NONE
          ),
          // Prisma Scalar Relation Field
          PrismaSchemaDSL.createScalarField(
            scalarRelationFieldName,
            ScalarType.String,
            true,
            true,
            !field.properties.allowMultipleSelection &&
              !relatedField?.properties.allowMultipleSelection &&
              !isOneToOneWithoutForeignKey
              ? true
              : field.unique,
            false,
            false,
            undefined,
            undefined,
            true
          ),
        ];
      }
      return originalHandler(field, entity, fieldNamesCount);
    };

    return {
      ...eventParams,
      dataSource: dataSource,
    };
  }

  private createRelationName(
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
}

export default MongoPlugin;
