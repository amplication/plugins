import {
  AmplicationPlugin,
  CreateAdminUIParams,
  CreateServerDotEnvParams,
  CreateServerDockerComposeParams,
  CreateServerDockerComposeDBParams,
  CreateEntityServiceBaseParams,
  CreateEntityServiceParams,
  CreateServerAuthParams,
  DsgContext,
  EntityField,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { getPluginSettings } from "./utils";
import { EnumAuthProviderType } from "@amplication/code-gen-types/src/models";
import { resolve } from "path";
import {
  createAuthModule,
  createKeycloakStrategy,
  createKeycloakStrategyBase,
  createKeycloakStrategySpec,
} from "./core";
import {
  addIdentifierToConstructorSuperCall,
  addImports,
  addInjectableDependency,
  awaitExpression,
  getClassDeclarationById,
  importNames,
  interpolate,
  logicalExpression,
  memberExpression,
} from "./util/ast";
import { builders, namedTypes } from "ast-types";
import { relativeImportPath } from "./util/module";
import { isPasswordField } from "./util/field";

const ARGS_ID = builders.identifier("args");
const PASSWORD_FIELD_ASYNC_METHODS = new Set(["create", "update"]);
const DATA_ID = builders.identifier("data");
const PASSWORD_SERVICE_ID = builders.identifier("PasswordService");
const PASSWORD_SERVICE_MEMBER_ID = builders.identifier("passwordService");
const HASH_MEMBER_EXPRESSION = memberExpression`this.${PASSWORD_SERVICE_MEMBER_ID}.hash`;
const TRANSFORM_STRING_FIELD_UPDATE_INPUT_ID = builders.identifier(
  "transformStringFieldUpdateInput"
);

import {
  updateDockerComposeDevProperties,
  updateDockerComposeProperties,
} from "./constants";

class KeycloakAuthPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      CreateAdminUI: {
        before: this.beforeCreateAdminModules,
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
      CreateServerAuth: {
        before: this.beforeCreateAuthModules,
        after: this.afterCreateAuthModules,
      },
      CreateEntityService: {
        before: this.beforeCreateEntityService,
      },
      CreateEntityServiceBase: {
        before: this.beforeCreateEntityServiceBase,
      },
    };
  }

  beforeCreateAdminModules(
    context: DsgContext,
    eventParams: CreateAdminUIParams
  ) {
    if (context.resourceInfo) {
      context.resourceInfo.settings.authProvider = EnumAuthProviderType.Http;
    }

    return eventParams;
  }

  beforeCreateAuthModules(
    context: DsgContext,
    eventParams: CreateServerAuthParams
  ) {
    context.utils.skipDefaultBehavior = true;
    return eventParams;
  }

  async afterCreateAuthModules(
    context: DsgContext,
    eventParams: CreateServerAuthParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const staticPath = resolve(__dirname, "./static");

    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.srcDirectory
    );

    // 1. create keycloakStrategy base file.
    const keycloakStrategyBase = await createKeycloakStrategyBase(context);
    await modules.set(keycloakStrategyBase);

    // 2. create keycloakStrategy  file.
    const keycloakStrategy = await createKeycloakStrategy(context);
    await modules.set(keycloakStrategy);

    // 3. create auth module  file.
    const authModule = await createAuthModule(context);
    await modules.set(authModule);

    // 4. create keycloakStrategy spec file.
    const keycloakStrategySpec = await createKeycloakStrategySpec(context);
    await modules.set(keycloakStrategySpec);

    await modules.merge(staticsFiles);
    return modules;
  }

  beforeCreateEntityService(
    context: DsgContext,
    eventParams: CreateEntityServiceParams
  ) {
    /*  
      TODO:
      Re-check and fix the function code.
    */
    const { template, serviceId, entityName, templateMapping } = eventParams;
    const modulePath = `${context.serverDirectories.srcDirectory}/${entityName}/${entityName}.service.ts`;
    const passwordFields = KeycloakAuthPlugin.getPasswordFields(
      context,
      eventParams.entityName
    );
    if (!passwordFields?.length) return eventParams;

    interpolate(template, templateMapping);

    //if there are any password fields, add imports, injection, and pass service to super
    if (passwordFields.length) {
      const classDeclaration = getClassDeclarationById(template, serviceId);

      addInjectableDependency(
        classDeclaration,
        PASSWORD_SERVICE_MEMBER_ID.name,
        PASSWORD_SERVICE_ID,
        "protected"
      );

      addIdentifierToConstructorSuperCall(template, PASSWORD_SERVICE_MEMBER_ID);

      for (const member of classDeclaration.body.body) {
        if (
          namedTypes.ClassMethod.check(member) &&
          namedTypes.Identifier.check(member.key) &&
          PASSWORD_FIELD_ASYNC_METHODS.has(member.key.name)
        ) {
          member.async = true;
        }
      }
      //add the password service
      addImports(template, [
        importNames(
          [PASSWORD_SERVICE_ID],
          relativeImportPath(
            modulePath,
            `${context.serverDirectories.srcDirectory}/auth/password.service.ts`
          )
        ),
      ]);
    }
    return eventParams;
  }

  beforeCreateEntityServiceBase(
    context: DsgContext,
    eventParams: CreateEntityServiceBaseParams
  ) {
    /*
      TODO::
      Re-check and fix this.
    */
    const { template, serviceBaseId, entityName, entity, templateMapping } =
      eventParams;
    const { serverDirectories } = context;
    const passwordFields = entity.fields.filter(isPasswordField);

    if (!passwordFields?.length) return eventParams;

    templateMapping["CREATE_ARGS_MAPPING"] =
      KeycloakAuthPlugin.createMutationDataMapping(
        passwordFields.map((field) => {
          const fieldId = builders.identifier(field.name);
          return builders.objectProperty(
            fieldId,
            awaitExpression`await ${HASH_MEMBER_EXPRESSION}(${ARGS_ID}.${DATA_ID}.${fieldId})`
          );
        })
      );

    templateMapping["UPDATE_ARGS_MAPPING"] =
      KeycloakAuthPlugin.createMutationDataMapping(
        passwordFields.map((field) => {
          const fieldId = builders.identifier(field.name);
          const valueMemberExpression = memberExpression`${ARGS_ID}.${DATA_ID}.${fieldId}`;
          return builders.objectProperty(
            fieldId,
            logicalExpression`${valueMemberExpression} && await ${TRANSFORM_STRING_FIELD_UPDATE_INPUT_ID}(
              ${ARGS_ID}.${DATA_ID}.${fieldId},
              (password) => ${HASH_MEMBER_EXPRESSION}(password)
            )`
          );
        })
      );

    interpolate(template, eventParams.templateMapping);

    const classDeclaration = getClassDeclarationById(template, serviceBaseId);
    const moduleBasePath = `${serverDirectories.srcDirectory}/${entityName}/base/${entityName}.service.base.ts`;

    addInjectableDependency(
      classDeclaration,
      PASSWORD_SERVICE_MEMBER_ID.name,
      PASSWORD_SERVICE_ID,
      "protected"
    );

    for (const member of classDeclaration.body.body) {
      if (
        namedTypes.ClassMethod.check(member) &&
        namedTypes.Identifier.check(member.key) &&
        PASSWORD_FIELD_ASYNC_METHODS.has(member.key.name)
      ) {
        member.async = true;
      }
    }

    //add the password service
    addImports(template, [
      importNames(
        [PASSWORD_SERVICE_ID],
        relativeImportPath(
          moduleBasePath,
          `${context.serverDirectories.srcDirectory}/auth/password.service.ts`
        )
      ),
    ]);

    addImports(template, [
      importNames(
        [TRANSFORM_STRING_FIELD_UPDATE_INPUT_ID],
        relativeImportPath(
          moduleBasePath,
          `${serverDirectories.srcDirectory}/prisma.util.ts`
        )
      ),
    ]);

    return eventParams;
  }

  private static getPasswordFields(
    context: DsgContext,
    entityName: string
  ): EntityField[] | undefined {
    const entity = context.entities?.find(
      (entity) =>
        entity.name.toLocaleLowerCase() === entityName.toLocaleLowerCase()
    );

    return entity?.fields.filter(isPasswordField);
  }

  private static createMutationDataMapping(
    mappings: namedTypes.ObjectProperty[]
  ): namedTypes.Identifier | namedTypes.ObjectExpression {
    if (!mappings.length) {
      return ARGS_ID;
    }
    return builders.objectExpression([
      builders.spreadProperty(ARGS_ID),
      builders.objectProperty(
        DATA_ID,
        builders.objectExpression([
          builders.spreadProperty(memberExpression`${ARGS_ID}.${DATA_ID}`),
          ...mappings,
        ])
      ),
    ]);
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams
  ) {
    const {
      host,
      realm,
      clientID,
      clientSecret,
      callbackURL
    } = getPluginSettings(context.pluginInstallations);

    eventParams.envVariables = [
      ...eventParams.envVariables,
      ...[
        { KC_HOST: host },
        { KC_REALM: realm },
        { KC_CLIENT_ID: clientID },
        { KC_CLIENT_SECRET: clientSecret },
        { KC_CALLBACK_URL: callbackURL },

        // { DB_USER: user },
        // { DB_PASSWORD: password },
        // { DB_PORT: port.toString() },
        // { DB_NAME: dbName },
        // {
        //   DB_URL: `mysql://${user}:${password}@${host}:${port}/${dbName}`,
        // },
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
}

export default KeycloakAuthPlugin;
