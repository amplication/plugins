import {
  AmplicationPlugin,
  CreatePrismaSchemaParams,
  CreateSchemaFieldResult,
  CreateServerDockerComposeDBParams,
  CreateServerDockerComposeParams,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  CreateServerParams,
  DsgContext,
  Entity,
  EntityField,
  EnumDataType,
  Events,
  LoadStaticFilesParams,
  LookupResolvedProperties,
  Module,
  ModuleMap,
  types,
} from "@amplication/code-gen-types";
import { camelCase } from "camel-case";
import { pascalCase } from "pascal-case";
import { resolve } from "path";
import * as PrismaSchemaDSL from "prisma-schema-dsl";
import { ReferentialActions, ScalarType } from "prisma-schema-dsl-types";
import { dataSource, updateDockerComposeProperties } from "./constants";
import { getPluginSettings } from "./utils";

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
      },
      LoadStaticFiles: {
        after: this.afterCreateServerStaticFiles,
      },
    };
  }

  beforeCreateServer(context: DsgContext, eventParams: CreateServerParams) {
    const generateErrorMessage =
      () => `The ID type: "Auto increment" is not supported by MongoDB Prisma provider. 
          To use MongoDB, You need to select another ID type for your entities`;

    const allAutoIncrementFields = context.entities?.filter((entity) =>
      entity.fields.find(
        (field) =>
          field.dataType === EnumDataType.Id &&
          (field?.properties as types.Id).idType === "AUTO_INCREMENT"
      )
    );

    if (
      allAutoIncrementFields !== undefined &&
      allAutoIncrementFields.length > 0
    ) {
      context.logger.error(generateErrorMessage());
      throw new Error(generateErrorMessage());
    }

    return eventParams;
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams
  ) {
    const myValues = {
      scripts: {
        "prisma:pull": "prisma db pull",
        "prisma:push": " prisma db push",
        "db:init": "run-s seed",
      },
    };

    eventParams.updateProperties.push(myValues);

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
          DB_URL: `mongodb://${user}:${password}@${host}:${port}/${dbName}?authSource=admin`,
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

  beforeCreateServerDockerComposeDB(
    context: DsgContext,
    eventParams: CreateServerDockerComposeDBParams
  ) {
    context.utils.skipDefaultBehavior = true;
    return eventParams;
  }

  async afterCreateServerDockerComposeDB(
    context: DsgContext
  ): Promise<ModuleMap> {
    const staticPath = resolve(__dirname, "./static/docker-compose");
    return await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.baseDirectory
    );
  }

  async afterCreateServerStaticFiles(
    context: DsgContext,
    eventParams: LoadStaticFilesParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const staticPathToHealthBaseService = resolve(__dirname, "./static/health");
    const staticsHealthBaseService = await context.utils.importStaticModules(
      staticPathToHealthBaseService,
      `${context.serverDirectories.srcDirectory}/health/base`
    );
    const staticPathToHealthServiceTest = resolve(
      __dirname,
      "./static/tests/health"
    );
    const staticsHealthServiceTest = await context.utils.importStaticModules(
      staticPathToHealthServiceTest,
      `${context.serverDirectories.srcDirectory}/tests/health`
    );

    modules.merge(staticsHealthBaseService, context.logger);
    modules.merge(staticsHealthServiceTest, context.logger);

    return modules;
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

      const isSelfRelation = relatedEntity.name === entity.name;

      if (hasManyToManyRelation || isSelfRelation) {
        const hasAnotherRelation = entity.fields.some(
          (entityField) =>
            entityField.id !== field.id &&
            entityField.dataType === EnumDataType.Lookup &&
            entityField.properties.relatedEntity.name === relatedEntity.name
        );

        const relationName = !hasAnotherRelation
          ? null
          : MongoPlugin.createRelationName(
              entity,
              field,
              relatedEntity,
              relatedField,
              fieldNamesCount ? fieldNamesCount[field.name] === 1 : false,
              fieldNamesCount ? fieldNamesCount[relatedField.name] === 1 : false
            );

        if (
          (allowMultipleSelection &&
            isSelfRelation &&
            !hasManyToManyRelation) ||
          isOneToOneWithoutForeignKey
        ) {
          return [
            PrismaSchemaDSL.createObjectField(
              name,
              relatedEntity.name,
              !isOneToOneWithoutForeignKey,
              allowMultipleSelection || false,
              relationName
            ),
          ];
        }

        const onDelete =
          isSelfRelation && !hasManyToManyRelation
            ? ReferentialActions.NoAction
            : ReferentialActions.NONE;

        const onUpdate =
          isSelfRelation && !hasManyToManyRelation
            ? ReferentialActions.NoAction
            : ReferentialActions.NONE;

        const scalarRelationFieldName = allowMultipleSelection
          ? `${name}Ids`
          : `${name}Id`;
        return [
          PrismaSchemaDSL.createObjectField(
            name,
            relatedEntity.name,
            allowMultipleSelection,
            allowMultipleSelection,
            relationName,
            [scalarRelationFieldName],
            ["id"],
            onDelete,
            onUpdate
          ),
          // Prisma Scalar Relation Field
          PrismaSchemaDSL.createScalarField(
            scalarRelationFieldName,
            ScalarType.String,
            allowMultipleSelection,
            allowMultipleSelection,
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
      const names: string[] = [];
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
