import {
  AmplicationPlugin,
  CreateEntityControllerBaseParams,
  CreateEntityControllerParams,
  CreateEntityControllerToManyRelationMethodsParams,
  CreateEntityModuleBaseParams,
  CreateEntityModuleParams,
  CreateEntityResolverBaseParams,
  CreateEntityResolverParams,
  CreateEntityResolverToManyRelationMethodsParams,
  CreateEntityResolverToOneRelationMethodsParams,
  CreateSeedParams,
  CreateServerAppModuleParams,
  CreateServerAuthParams,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  CreateServerParams,
  DsgContext,
  EntityField,
  EnumEntityAction,
  EnumEntityPermissionType,
  Events,
  ModuleMap,
} from "@amplication/code-gen-types";
import { AUTH_ENTITY_FIELD_ROLES, envVariables } from "./constants";
import { resolve } from "path";
import {
  createUserInfo,
  createTokenPayloadInterface,
  createAuthConstants,
  createGrantsModule,
  createAuthController,
  createAuthResolver,
  createAuthService,
  createIAuthStrategy,
  createAuthServiceSpec,
  createUserDataDecorator,
  createCustomSeed,
} from "./core";
import {
  AddIdentifierFromModuleDecorator,
  addIdentifierToConstructorSuperCall,
  addImports,
  getClassDeclarationById,
  getClassMethodById,
  importNames,
  interpolate,
} from "./util/ast";
import { builders, namedTypes } from "ast-types";
import { setAuthPermissions } from "./util/set-endpoint-permissions";
import {
  controllerMethodsIdsActionPairs,
  controllerToManyMethodsIdsActionPairs,
  EnumTemplateType,
  resolverMethodsIdsActionPairs,
} from "./core/create-method-id-action-entity-map";
import {
  addInjectableDependency,
  buildSwaggerForbiddenResponse,
} from "./util/nestjs-code-generation";
import {
  BlockStatement,
  IfStatement,
  Statement,
  FunctionDeclaration,
  Identifier,
  TSTypeAnnotation,
} from "@babel/types";
import { appendImports, parse, print } from "@amplication/code-gen-utils";
import { merge } from "lodash";

const TO_MANY_MIXIN_ID = builders.identifier("Mixin");

class AuthCorePlugin implements AmplicationPlugin {
  register(): Events {
    return {
      CreateServerDotEnv: {
        before: this.beforeCreateServerDotEnv,
      },
      CreateServerPackageJson: {
        before: this.beforeCreateServerPackageJson,
        after: this.afterCreateServerPackageJson,
      },
      CreateServerAppModule: {
        before: this.beforeCreateAppModule,
        after: this.afterCreateAppModule,
      },
      CreateServerAuth: {
        after: this.afterCreateServerAuth,
      },
      CreateEntityModuleBase: {
        before: this.beforeCreateEntityModuleBase,
      },
      CreateEntityModule: {
        before: this.beforeCreateEntityModule,
      },
      CreateEntityControllerBase: {
        before: this.beforeCreateControllerBaseModule,
      },
      CreateEntityController: {
        before: this.beforeCreateEntityControllerModule,
      },
      CreateEntityControllerToManyRelationMethods: {
        before: this.beforeCreateEntityControllerToManyRelationMethods,
      },
      CreateEntityResolver: {
        before: this.beforeCreateResolverModule,
      },
      CreateEntityResolverBase: {
        before: this.beforeCreateResolverBaseModule,
      },
      CreateEntityResolverToManyRelationMethods: {
        before: this.beforeCreateEntityResolverToManyRelationMethods,
      },
      CreateEntityResolverToOneRelationMethods: {
        before: this.beforeCreateEntityResolverToOneRelationMethods,
      },
      CreateSeed: {
        before: this.beforeCreateSeed,
        after: this.afterCreateSeed,
      },
      CreateServer: {
        before: this.beforeCreateServer,
      },
    };
  }

  beforeCreateServer(context: DsgContext, eventParams: CreateServerParams) {
    const authEntity = context.entities?.find(
      (x) => x.name === context.resourceInfo?.settings.authEntityName
    );
    if (!authEntity) {
      throw new Error(`Authentication entity does not exist`);
    }

    const authEntityFieldRoles = authEntity.fields.find(
      (x) => x.name === AUTH_ENTITY_FIELD_ROLES
    );

    if (!authEntityFieldRoles) {
      throw new Error(
        `Authentication entity does not have a field named ${AUTH_ENTITY_FIELD_ROLES}`
      );
    }

    return eventParams;
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams
  ) {
    eventParams.envVariables = [...eventParams.envVariables, ...envVariables];

    return eventParams;
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams
  ) {
    const myValues = {
      dependencies: {
        "@nestjs/jwt": "^10.1.1",
        "@nestjs/passport": "^10.0.2",
        "nest-access-control": "^3.1.0",
        passport: "0.6.0",
        "passport-http": "0.3.0",
        "passport-jwt": "4.0.1",
      },
      devDependencies: {
        "@types/passport-http": "0.3.9",
        "@types/passport-jwt": "3.0.10",
      },
    };

    eventParams.updateProperties.forEach((updateProperty) =>
      merge(updateProperty, myValues)
    );

    return eventParams;
  }

  beforeCreateAppModule(
    context: DsgContext,
    eventParams: CreateServerAppModuleParams
  ) {
    const aclModuleId = builders.identifier("ACLModule");
    const authModuleId = builders.identifier("AuthModule");

    const importArray = builders.arrayExpression([
      aclModuleId,
      authModuleId,
      ...eventParams.templateMapping["MODULES"].elements,
    ]);

    eventParams.templateMapping["MODULES"] = importArray;

    return eventParams;
  }

  async afterCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    // create grants here, because here the DSG format this code to json file.
    const grants =
      context.entities && context.roles
        ? createGrantsModule(
          context.serverDirectories.srcDirectory,
          context.entities,
          context.roles
        )
        : null;

    if (grants) {
      await modules.set(grants);
    }

    return modules;
  }

  async afterCreateAppModule(
    context: DsgContext,
    eventParams: CreateServerAppModuleParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const [appModule] = modules.modules();

    if (!appModule) return modules;
    const file = parse(appModule.code);
    const aclModuleId = builders.identifier("ACLModule");
    const authModuleId = builders.identifier("AuthModule");

    const aclModuleImport = importNames([aclModuleId], "./auth/acl.module");
    const authModuleImport = importNames([authModuleId], "./auth/auth.module");

    appendImports(file, [aclModuleImport, authModuleImport]);

    const updatedModules = new ModuleMap(context.logger);
    appModule.code = print(file).code;
    await updatedModules.set(appModule);
    return updatedModules;
  }

  async afterCreateSeed(
    context: DsgContext,
    eventParams: CreateSeedParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const staticPath = resolve(__dirname, "./static/scripts");
    const staticsFiles = await AuthCorePlugin.getStaticFiles(
      context,
      context.serverDirectories.scriptsDirectory,
      staticPath
    );
    await modules.merge(staticsFiles);
    return modules;
  }

  async afterCreateServerAuth(
    context: DsgContext,
    eventParams: CreateServerAuthParams,
    modules: ModuleMap
  ): Promise<ModuleMap> {
    const staticPath = resolve(__dirname, "./static/auth");

    const interceptorsStaticPath = resolve(__dirname, "./static/interceptors");

    const staticsInterceptorsFiles = await AuthCorePlugin.getStaticFiles(
      context,
      `${context.serverDirectories.srcDirectory}/interceptors`,
      interceptorsStaticPath
    );

    const staticsFiles = await AuthCorePlugin.getStaticFiles(
      context,
      context.serverDirectories.authDirectory,
      staticPath
    );

    await staticsFiles.merge(staticsInterceptorsFiles);

    // 1. create user info
    const userInfo = await createUserInfo(context);
    await modules.set(userInfo);

    // 2. create token payload interface
    const tokenPayloadInterface = await createTokenPayloadInterface(context);
    await modules.set(tokenPayloadInterface);

    // 3. create constants for tests
    const authConstants = await createAuthConstants(context);
    await modules.set(authConstants);

    // 4. create auth controller
    const authController = await createAuthController(context);
    await modules.set(authController);

    // 5. create auth resolver
    const authResolver = await createAuthResolver(context);
    await modules.set(authResolver);

    // 6. create auth service
    const authService = await createAuthService(context);
    await modules.set(authService);

    // 7. create IAuthStrategy interface
    const iAuthStrategy = await createIAuthStrategy(context);
    await modules.set(iAuthStrategy);

    // 8. create auth-service-spec
    const authServiceSpec = await createAuthServiceSpec(context);
    await modules.set(authServiceSpec);

    // 9. create userData decorator
    const userDataDecorator = await createUserDataDecorator(context);
    await modules.set(userDataDecorator);

    // 10. create custom seed script
    const customSeedScript = await createCustomSeed(context);
    await modules.set(customSeedScript);

    await modules.merge(staticsFiles);

    return modules;
  }

  async beforeCreateEntityModule(
    context: DsgContext,
    eventParams: CreateEntityModuleParams
  ) {
    const { template, templateMapping } = eventParams;
    const authModuleId = builders.identifier("AuthModule");
    const forwardRefId = builders.identifier("forwardRef");
    const forwardRefArrowFunction = builders.arrowFunctionExpression(
      [],
      authModuleId
    );

    const forwardAuthId = builders.callExpression(forwardRefId, [
      forwardRefArrowFunction,
    ]);

    const authModuleImport = importNames([authModuleId], "../auth/auth.module");
    const forwardRefImport = importNames([forwardRefId], "@nestjs/common");

    interpolate(template, templateMapping);

    AddIdentifierFromModuleDecorator(
      template,
      templateMapping["MODULE_BASE"],
      forwardAuthId
    );

    addImports(
      template,
      [authModuleImport, forwardRefImport].filter(
        (x) => x //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[]
    );

    return eventParams;
  }

  async beforeCreateEntityModuleBase(
    context: DsgContext,
    eventParams: CreateEntityModuleBaseParams
  ) {
    const aclModuleId = builders.identifier("ACLModule");

    const aclModuleImport = importNames([aclModuleId], "../../auth/acl.module");

    const importArray = builders.arrayExpression([
      aclModuleId,
      ...eventParams.templateMapping["IMPORTS_ARRAY"].elements,
    ]);

    const exportArray = builders.arrayExpression([
      aclModuleId,
      ...eventParams.templateMapping["EXPORT_ARRAY"].elements,
    ]);

    eventParams.templateMapping["IMPORTS_ARRAY"] = importArray;
    eventParams.templateMapping["EXPORT_ARRAY"] = exportArray;

    addImports(
      eventParams.template,
      [aclModuleImport].filter(
        (x) => x //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[]
    );
    return eventParams;
  }

  private static async getStaticFiles(
    context: DsgContext,
    basePath: string,
    staticPath: string
  ): Promise<ModuleMap> {
    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      basePath
    );

    return staticsFiles;
  }
  beforeCreateEntityControllerModule(
    context: DsgContext,
    eventParams: CreateEntityControllerParams
  ) {
    const { templateMapping, template, controllerBaseId } = eventParams;

    interpolate(template, templateMapping);

    const classDeclaration = getClassDeclarationById(
      template,
      templateMapping["CONTROLLER"]
    );

    const nestAccessControlImport = builders.importDeclaration(
      [
        builders.importNamespaceSpecifier(
          builders.identifier("nestAccessControl")
        ),
      ],
      builders.stringLiteral("nest-access-control")
    );

    const rolesBuilderIdentifier = builders.identifier("rolesBuilder");

    const injectRolesBuilderDecorator = builders.decorator(
      builders.callExpression(
        builders.memberExpression(
          builders.identifier("nestAccessControl"),
          builders.identifier("InjectRolesBuilder")
        ),
        []
      )
    );

    addInjectableDependency(
      classDeclaration,
      rolesBuilderIdentifier.name,
      builders.identifier("nestAccessControl.RolesBuilder"),
      "protected",
      [injectRolesBuilderDecorator]
    );

    addIdentifierToConstructorSuperCall(template, rolesBuilderIdentifier);

    addImports(
      eventParams.template,
      [nestAccessControlImport].filter(
        (x) => x //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[]
    );

    return eventParams;
  }

  beforeCreateControllerBaseModule(
    context: DsgContext,
    eventParams: CreateEntityControllerBaseParams
  ) {
    const { templateMapping, entity, template, controllerBaseId } = eventParams;

    interpolate(template, templateMapping);

    const classDeclaration = getClassDeclarationById(
      template,
      controllerBaseId
    );

    addInjectableDependency(
      classDeclaration,
      builders.identifier("rolesBuilder").name,
      builders.identifier("nestAccessControl.RolesBuilder"),
      "protected"
    );

    const nestAccessControlImport = builders.importDeclaration(
      [
        builders.importNamespaceSpecifier(
          builders.identifier("nestAccessControl")
        ),
      ],
      builders.stringLiteral("nest-access-control")
    );

    const defaultAuthGuardImport = builders.importDeclaration(
      [
        builders.importNamespaceSpecifier(
          builders.identifier("defaultAuthGuard")
        ),
      ],
      builders.stringLiteral("../../auth/defaultAuth.guard")
    );

    addImports(
      eventParams.template,
      [nestAccessControlImport, defaultAuthGuardImport].filter(
        (x) => x //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[]
    );

    const swaggerDecorator = builders.decorator(
      builders.callExpression(
        builders.memberExpression(
          builders.identifier("swagger"),
          builders.identifier("SWAGGER_API_AUTH_FUNCTION")
        ),
        []
      )
    );

    const guardDecorator = builders.decorator(
      builders.callExpression(
        builders.memberExpression(
          builders.identifier("common"),
          builders.identifier("UseGuards")
        ),
        [
          builders.memberExpression(
            builders.identifier("defaultAuthGuard"),
            builders.identifier("DefaultAuthGuard")
          ),
          builders.memberExpression(
            builders.identifier("nestAccessControl"),
            builders.identifier("ACGuard")
          ),
        ]
      )
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    classDeclaration.decorators = [swaggerDecorator, guardDecorator];

    if (classDeclaration) {
      controllerMethodsIdsActionPairs(templateMapping, entity).forEach(
        ({ methodId, action, entity, permissionType, methodName }) => {
          setAuthPermissions(
            classDeclaration,
            methodId,
            action,
            entity.name,
            true,
            EnumTemplateType.ControllerBase,
            permissionType,
            methodName
          );
          if (permissionType === EnumEntityPermissionType.Public) {
            const classMethod = getClassMethodById(classDeclaration, methodId);
            classMethod?.decorators?.push(buildSwaggerForbiddenResponse());
          }
        }
      );
    }

    return eventParams;
  }

  beforeCreateEntityControllerToManyRelationMethods(
    context: DsgContext,
    eventParams: CreateEntityControllerToManyRelationMethodsParams
  ) {
    const relatedEntity = eventParams.field.properties?.relatedEntity;

    interpolate(eventParams.toManyFile, eventParams.toManyMapping);

    const toManyClassDeclaration = getClassDeclarationById(
      eventParams.toManyFile,
      TO_MANY_MIXIN_ID
    );

    controllerToManyMethodsIdsActionPairs(
      eventParams.toManyMapping,
      eventParams.entity,
      relatedEntity
    ).forEach(({ methodId, action, entity, permissionType }) => {
      setAuthPermissions(
        toManyClassDeclaration,
        methodId,
        action,
        entity.name,
        true,
        EnumTemplateType.controllerToManyMethods,
        permissionType
      );
    });

    return eventParams;
  }

  beforeCreateEntityResolverToOneRelationMethods(
    context: DsgContext,
    eventParams: CreateEntityResolverToOneRelationMethodsParams
  ) {
    const relatedEntity = eventParams.field.properties?.relatedEntity;

    interpolate(eventParams.toOneFile, eventParams.toOneMapping);

    const classDeclaration = getClassDeclarationById(
      eventParams.toOneFile,
      TO_MANY_MIXIN_ID
    );

    setAuthPermissions(
      classDeclaration,
      eventParams.toOneMapping["FIND_ONE"] as namedTypes.Identifier,
      EnumEntityAction.View,
      relatedEntity.name,
      false,
      EnumTemplateType.ResolverFindOne,
      relatedEntity.permissions.find((p) => p.action === EnumEntityAction.View)
        ?.type
    );

    return eventParams;
  }

  beforeCreateEntityResolverToManyRelationMethods(
    context: DsgContext,
    eventParams: CreateEntityResolverToManyRelationMethodsParams
  ) {
    const relatedEntity = eventParams.field.properties?.relatedEntity;

    interpolate(eventParams.toManyFile, eventParams.toManyMapping);

    const toManyClassDeclaration = getClassDeclarationById(
      eventParams.toManyFile,
      TO_MANY_MIXIN_ID
    );

    setAuthPermissions(
      toManyClassDeclaration,
      eventParams.toManyMapping["FIND_MANY"] as namedTypes.Identifier,
      EnumEntityAction.Search,
      relatedEntity.name,
      false,
      EnumTemplateType.ResolverToManyMethods,
      relatedEntity.permissions.find(
        (p) => p.action === EnumEntityAction.Search
      )?.type
    );

    return eventParams;
  }

  beforeCreateResolverModule(
    context: DsgContext,
    eventParams: CreateEntityResolverParams
  ) {
    const { templateMapping, template } = eventParams;
    interpolate(template, templateMapping);

    const classDeclaration = getClassDeclarationById(
      template,
      templateMapping["RESOLVER"]
    );

    const commonImport = builders.importDeclaration(
      [builders.importNamespaceSpecifier(builders.identifier("common"))],
      builders.stringLiteral("@nestjs/common")
    );

    const nestAccessControlImport = builders.importDeclaration(
      [
        builders.importNamespaceSpecifier(
          builders.identifier("nestAccessControl")
        ),
      ],
      builders.stringLiteral("nest-access-control")
    );

    const gqlDefaultAuthGuardImport = importNames(
      [builders.identifier("GqlDefaultAuthGuard")],
      "../auth/gqlDefaultAuth.guard"
    );

    const gqlACGuardImport = builders.importDeclaration(
      [builders.importNamespaceSpecifier(builders.identifier("gqlACGuard"))],
      builders.stringLiteral("../auth/gqlAC.guard")
    );

    addImports(
      eventParams.template,
      [
        nestAccessControlImport,
        gqlACGuardImport,
        gqlDefaultAuthGuardImport,
        commonImport,
      ].filter(
        (x) => x //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[]
    );

    const rolesBuilderIdentifier = builders.identifier("rolesBuilder");

    const injectRolesBuilderDecorator = builders.decorator(
      builders.callExpression(
        builders.memberExpression(
          builders.identifier("nestAccessControl"),
          builders.identifier("InjectRolesBuilder")
        ),
        []
      )
    );

    addInjectableDependency(
      classDeclaration,
      rolesBuilderIdentifier.name,
      builders.identifier("nestAccessControl.RolesBuilder"),
      "protected",
      [injectRolesBuilderDecorator]
    );

    addIdentifierToConstructorSuperCall(template, rolesBuilderIdentifier);

    const guardDecorator = builders.decorator(
      builders.callExpression(
        builders.memberExpression(
          builders.identifier("common"),
          builders.identifier("UseGuards")
        ),
        [
          builders.identifier("GqlDefaultAuthGuard"),
          builders.memberExpression(
            builders.identifier("gqlACGuard"),
            builders.identifier("GqlACGuard")
          ),
        ]
      )
    );

    const resolverDecorator = builders.decorator(
      builders.callExpression(
        builders.memberExpression(
          builders.identifier("graphql"),
          builders.identifier("Resolver")
        ),
        [
          builders.arrowFunctionExpression(
            [],
            eventParams.templateMapping["ENTITY"]
          ),
        ]
      )
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    classDeclaration.decorators = [guardDecorator, resolverDecorator];

    return eventParams;
  }

  beforeCreateResolverBaseModule(
    context: DsgContext,
    eventParams: CreateEntityResolverBaseParams
  ) {
    const { templateMapping, entity, template, resolverBaseId } = eventParams;

    interpolate(template, templateMapping);

    const classDeclaration = getClassDeclarationById(template, resolverBaseId);

    const nestAccessControlImport = builders.importDeclaration(
      [
        builders.importNamespaceSpecifier(
          builders.identifier("nestAccessControl")
        ),
      ],
      builders.stringLiteral("nest-access-control")
    );

    const gqlACGuardImport = builders.importDeclaration(
      [builders.importNamespaceSpecifier(builders.identifier("gqlACGuard"))],
      builders.stringLiteral("../../auth/gqlAC.guard")
    );

    const gqlDefaultAuthGuardId = builders.identifier("GqlDefaultAuthGuard");
    const gqlDefaultAuthGuardImport = importNames(
      [gqlDefaultAuthGuardId],
      "../../auth/gqlDefaultAuth.guard"
    );

    const commonImport = builders.importDeclaration(
      [builders.importNamespaceSpecifier(builders.identifier("common"))],
      builders.stringLiteral("@nestjs/common")
    );

    addImports(
      eventParams.template,
      [
        nestAccessControlImport,
        gqlACGuardImport,
        gqlDefaultAuthGuardImport,
        commonImport,
      ].filter(
        (x) => x //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[]
    );
    if (classDeclaration) {
      const metaClassMethod = getClassMethodById(
        classDeclaration,
        eventParams.templateMapping["META_QUERY"] as namedTypes.Identifier
      );
      const graphqlQueryDecorator = builders.decorator(
        builders.callExpression(
          builders.memberExpression(
            builders.identifier("graphql"),
            builders.identifier("Query")
          ),
          [
            builders.arrowFunctionExpression(
              [],
              builders.identifier("MetaQueryPayload")
            ),
          ]
        )
      );

      const useRolesDecorator = builders.decorator(
        builders.callExpression(
          builders.memberExpression(
            builders.identifier("nestAccessControl"),
            builders.identifier("UseRoles")
          ),
          [
            builders.objectExpression([
              builders.objectProperty(
                builders.identifier("resource"),
                eventParams.templateMapping[
                "ENTITY_NAME"
                ] as namedTypes.StringLiteral
              ),
              builders.objectProperty(
                builders.identifier("action"),
                builders.stringLiteral("read")
              ),
              builders.objectProperty(
                builders.identifier("possession"),
                builders.stringLiteral("any")
              ),
            ]),
          ]
        )
      );

      if (metaClassMethod && !metaClassMethod.decorators) {
        metaClassMethod.decorators = [];
      }
      metaClassMethod?.decorators?.unshift(
        graphqlQueryDecorator,
        useRolesDecorator
      );

      resolverMethodsIdsActionPairs(templateMapping, entity).forEach(
        ({ methodId, action, entity, permissionType, methodName }) => {
          setAuthPermissions(
            classDeclaration,
            methodId,
            action,
            entity.name,
            false,
            EnumTemplateType.ResolverBase,
            permissionType,
            methodName
          );
        }
      );
    }

    const guardDecorator = builders.decorator(
      builders.callExpression(
        builders.memberExpression(
          builders.identifier("common"),
          builders.identifier("UseGuards")
        ),
        [
          builders.identifier("GqlDefaultAuthGuard"),
          builders.memberExpression(
            builders.identifier("gqlACGuard"),
            builders.identifier("GqlACGuard")
          ),
        ]
      )
    );

    const resolverDecorator = builders.decorator(
      builders.callExpression(
        builders.memberExpression(
          builders.identifier("graphql"),
          builders.identifier("Resolver")
        ),
        [
          builders.arrowFunctionExpression(
            [],
            eventParams.templateMapping["ENTITY"]
          ),
        ]
      )
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    classDeclaration.decorators = [guardDecorator, resolverDecorator];

    addInjectableDependency(
      classDeclaration,
      builders.identifier("rolesBuilder").name,
      builders.identifier("nestAccessControl.RolesBuilder"),
      "protected"
    );

    return eventParams;
  }

  async beforeCreateSeed(context: DsgContext, eventParams: CreateSeedParams) {
    interpolate(eventParams.template, eventParams.templateMapping);

    const passwordImport = importNames(
      [builders.identifier("Salt"), builders.identifier("parseSalt")],
      "../src/auth/password.service"
    );

    const hashImport = importNames([builders.identifier("hash")], "bcrypt");

    addImports(
      eventParams.template,
      [passwordImport, hashImport].filter(
        (x) => x //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[]
    );

    const ifStatementFromBody = eventParams.template.program.body.find(
      (x) => x.type === "IfStatement"
    ) as IfStatement;

    const functionDeclarationFromBody = eventParams.template.program.body.find(
      (x) => x.type === "FunctionDeclaration"
    ) as FunctionDeclaration;

    const ifBlock = ifStatementFromBody.consequent as BlockStatement;
    const functionDeclarationBlock =
      functionDeclarationFromBody.body as BlockStatement;

    const saltConstVariable = builders.variableDeclaration("const", [
      builders.variableDeclarator(
        builders.identifier("salt"),
        builders.callExpression(builders.identifier("parseSalt"), [
          builders.identifier("BCRYPT_SALT"),
        ])
      ),
    ]) as Statement;

    const blockCode: namedTypes.BlockStatement = {
      body: [
        builders.expressionStatement(
          builders.callExpression(
            builders.memberExpression(
              builders.identifier("console"),
              builders.identifier("error")
            ),
            [builders.identifier("error")]
          )
        ),
        builders.expressionStatement(
          builders.callExpression(
            builders.memberExpression(
              builders.identifier("process"),
              builders.identifier("exit")
            ),
            [builders.numericLiteral(1)]
          )
        ),
      ],
      directives: [],
      type: "BlockStatement",
    };

    const saltExpression = builders.expressionStatement(
      builders.callExpression(
        builders.memberExpression(
          builders.callExpression(builders.identifier("seed"), [
            builders.identifier("salt"),
          ]),
          builders.identifier("catch")
        ),
        [
          builders.arrowFunctionExpression(
            [builders.identifier("error")],
            blockCode
          ),
        ]
      )
    ) as Statement;

    const bcryptSaltIdentifier = builders.identifier(
      "bcryptSalt"
    ) as Identifier;
    bcryptSaltIdentifier.typeAnnotation = builders.tsTypeAnnotation(
      builders.tsTypeReference(builders.identifier("Salt"))
    ) as TSTypeAnnotation;

    const authEntity = context.entities?.find(
      (x) => x.name === context.resourceInfo?.settings.authEntityName
    );

    if (!authEntity) {
      context.logger.error(`Authentication entity does not exist`);
      return eventParams;
    }

    const functionExp = builders.expressionStatement(
      builders.awaitExpression(
        builders.callExpression(
          builders.memberExpression(
            builders.memberExpression(
              builders.identifier("client"),
              builders.identifier(authEntity.name.toLocaleLowerCase())
            ),
            builders.identifier("upsert")
          ),
          [
            builders.objectExpression([
              builders.objectProperty(
                builders.identifier("where"),
                builders.objectExpression([
                  builders.objectProperty(
                    builders.identifier("username"),
                    builders.memberExpression(
                      builders.identifier("data"),
                      builders.identifier("username")
                    )
                  ),
                ])
              ),
              builders.objectProperty(
                builders.identifier("update"),
                builders.objectExpression([])
              ),
              builders.objectProperty(
                builders.identifier("create"),
                builders.identifier("data")
              ),
            ]),
          ]
        )
      )
    ) as Statement;

    const dataVar = builders.variableDeclaration("const", [
      builders.variableDeclarator(
        builders.identifier("data"),
        builders.identifier("DATA")
      ),
    ]) as Statement;

    functionDeclarationFromBody.params.push(bcryptSaltIdentifier);
    const prevStatement2 = functionDeclarationBlock.body[2];
    const prevStatement3 = functionDeclarationBlock.body[3];
    const prevStatement4 = functionDeclarationBlock.body[4];
    const prevStatement5 = functionDeclarationBlock.body[5];

    functionDeclarationBlock.body[2] = dataVar;
    functionDeclarationBlock.body[3] = functionExp;
    functionDeclarationBlock.body[4] = prevStatement2;
    functionDeclarationBlock.body[5] = prevStatement3;
    functionDeclarationBlock.body[6] = prevStatement4;
    functionDeclarationBlock.body[7] = prevStatement5;

    ifBlock.body.push(saltConstVariable, saltExpression);

    return eventParams;
  }
}

export default AuthCorePlugin;
