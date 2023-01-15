import {
  AmplicationPlugin,
  CreateEntityControllerBaseParams,
  CreateEntityControllerParams,
  CreateEntityControllerToManyRelationMethodsParams,
  CreateEntityModuleBaseParams,
  CreateEntityResolverBaseParams,
  CreateEntityResolverParams,
  CreateEntityResolverToManyRelationMethodsParams,
  CreateEntityResolverToOneRelationMethodsParams,
  CreateEntityServiceBaseParams,
  CreateEntityServiceParams,
  CreateSeedParams,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  DsgContext,
  EntityField,
  EnumEntityAction,
  Events,
  Module,
} from "@amplication/code-gen-types";
import { envVariables } from "./constants";
import { resolve } from "path";
import {
  createUserInfo,
  createTokenPayloadInterface,
  createAuthConstants,
  createTokenService,
  createTokenServiceTests,
  createGrantsModule,
  createDefaultGuard,
} from "./core";
import {
  addIdentifierToConstructorSuperCall,
  addImports,
  getClassDeclarationById,
  importNames,
  interpolate,
  memberExpression,
} from "./util/ast";
import { isPasswordField } from "./util/field";
import { builders, namedTypes } from "ast-types";
import { setAuthPermissions } from "./util/set-endpoint-permissions";
import {
  controllerMethodsIdsActionPairs,
  controllerToManyMethodsIdsActionPairs,
  resolverMethodsIdsActionPairs,
} from "./core/create-method-id-action-entity-map";
import { relativeImportPath } from "./util/module";
import { addInjectableDependency } from "./util/nestjs-code-generation";
import {
  BlockStatement,
  IfStatement,
  Statement,
  FunctionDeclaration,
  Identifier,
  TSTypeAnnotation,
} from "@babel/types";

const TO_MANY_MIXIN_ID = builders.identifier("Mixin");
const ARGS_ID = builders.identifier("args");
const PASSWORD_FIELD_ASYNC_METHODS = new Set(["create", "update"]);
const DATA_ID = builders.identifier("data");
const PASSWORD_SERVICE_ID = builders.identifier("PasswordService");
const PASSWORD_SERVICE_MEMBER_ID = builders.identifier("passwordService");
const HASH_MEMBER_EXPRESSION = memberExpression`this.${PASSWORD_SERVICE_MEMBER_ID}.hash`;
const TRANSFORM_STRING_FIELD_UPDATE_INPUT_ID = builders.identifier(
  "transformStringFieldUpdateInput"
);
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
      CreateServerAuth: {
        after: this.afterCreateServerAuth,
      },
      CreateEntityModuleBase: {
        before: this.beforeCreateEntityModuleBase,
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
      CreateEntityService: {
        before: this.beforeCreateEntityService,
      },
      CreateEntityServiceBase: {
        before: this.beforeCreateEntityServiceBase,
      },
      CreateSeed: {
        before: this.beforeCreateSeed,
      },
    };
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
    context.utils.skipDefaultBehavior = true;
    return eventParams;
  }

  async afterCreateServerPackageJson(context: DsgContext) {
    const staticPath = resolve(__dirname, "../static/package-json");
    const staticsFiles = await AuthCorePlugin.getStaticFiles(
      context,
      context.serverDirectories.baseDirectory,
      staticPath
    );

    // create grants here, because here the DSG format this code to json file.
    const grants =
      context.entities && context.roles
        ? createGrantsModule(
            context.serverDirectories.srcDirectory,
            context.entities,
            context.roles
          )
        : null;

    return grants ? [...staticsFiles, grants] : staticsFiles;
  }

  async afterCreateServerAuth(context: DsgContext) {
    const staticPath = resolve(__dirname, "../static/auth");
    const interceptorsStaticPath = resolve(__dirname, "../static/interceptors");
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

    staticsInterceptorsFiles.forEach((file) => {
      staticsFiles.push(file);
    });

    // 1. create user info
    const userInfo = await createUserInfo(context);
    // 2. create token payload interface
    const tokenPayloadInterface = await createTokenPayloadInterface(context);
    // 3. create constants for tests
    const athConstants = await createAuthConstants(context);
    // 4. create token service
    const tokenService = await createTokenService(context);
    // 5. create token service test
    const tokenServiceTest = await createTokenServiceTests(context);
    // 6. create create Default Guard
    const { resourceInfo, serverDirectories } = context;
    const authDir = `${serverDirectories.srcDirectory}/auth`;
    const authTestsDir = `${serverDirectories.srcDirectory}/tests/auth`;

    let defaultGuardFile: Module = {
      path: "",
      code: "",
    };
    if (resourceInfo) {
      defaultGuardFile = await createDefaultGuard(
        resourceInfo.settings.authProvider,
        authDir
      );
    }

    return [
      userInfo,
      tokenPayloadInterface,
      athConstants,
      tokenService,
      tokenServiceTest,
      ...staticsFiles,
      defaultGuardFile,
    ];
  }

  async beforeCreateEntityModuleBase(
    context: DsgContext,
    eventParams: CreateEntityModuleBaseParams
  ) {
    const aclModuleId = builders.identifier("ACLModule");
    const authModuleId = builders.identifier("AuthModule");
    const forwardRefId = builders.identifier("forwardRef");
    const forwardRefArrowFunction = builders.arrowFunctionExpression(
      [],
      authModuleId
    );

    const forwardAuthId = builders.callExpression(forwardRefId, [
      forwardRefArrowFunction,
    ]);

    const aclModuleImport = importNames([aclModuleId], "../../auth/acl.module");
    const authModuleImport = importNames(
      [authModuleId],
      "../../auth/auth.module"
    );
    const forwardRefImport = importNames([forwardRefId], "@nestjs/common");

    const importArray = builders.arrayExpression([
      aclModuleId,
      authModuleId,
      forwardAuthId,
      ...eventParams.templateMapping["IMPORTS_ARRAY"].elements,
    ]);

    const exportArray = builders.arrayExpression([
      aclModuleId,
      authModuleId,
      ...eventParams.templateMapping["EXPORT_ARRAY"].elements,
    ]);

    eventParams.templateMapping["IMPORTS_ARRAY"] = importArray;
    eventParams.templateMapping["EXPORT_ARRAY"] = exportArray;

    addImports(
      eventParams.template,
      [aclModuleImport, authModuleImport, forwardRefImport].filter(
        (x) => x //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[]
    );
    return eventParams;
  }

  private static async getStaticFiles(
    context: DsgContext,
    basePath: string,
    staticPath: string
  ) {
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
    addInjectableDependency(
      classDeclaration,
      rolesBuilderIdentifier.name,
      builders.identifier("nestAccessControl.RolesBuilder"),
      "protected"
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

    const ignoreComment = builders.commentLine("// @ts-ignore", false);

    if (!defaultAuthGuardImport.comments) {
      defaultAuthGuardImport.comments = [];
    }

    defaultAuthGuardImport.comments.push(ignoreComment);

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

    //@ts-ignore
    classDeclaration.decorators = [swaggerDecorator, guardDecorator];

    if (classDeclaration) {
      controllerMethodsIdsActionPairs(templateMapping, entity).forEach(
        ({ methodId, action, entity }) => {
          setAuthPermissions(classDeclaration, methodId, action, entity.name);
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
    ).forEach(({ methodId, action, entity }) => {
      setAuthPermissions(toManyClassDeclaration, methodId, action, entity.name);
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
      relatedEntity.name
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
      relatedEntity.name
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

    addInjectableDependency(
      classDeclaration,
      rolesBuilderIdentifier.name,
      builders.identifier("nestAccessControl.RolesBuilder"),
      "protected"
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

    //@ts-ignore
    classDeclaration.decorators = [guardDecorator];

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

    const swaggerImport = builders.importDeclaration(
      [builders.importNamespaceSpecifier(builders.identifier("swagger"))],
      builders.stringLiteral("@nestjs/swagger")
    );

    const commonImport = builders.importDeclaration(
      [builders.importNamespaceSpecifier(builders.identifier("common"))],
      builders.stringLiteral("@nestjs/common")
    );

    const ignoreComment = builders.commentLine("// @ts-ignore", false);

    if (!gqlACGuardImport.comments) {
      gqlACGuardImport.comments = [];
    }

    gqlACGuardImport.comments.push(ignoreComment);

    addImports(
      eventParams.template,
      [
        nestAccessControlImport,
        gqlACGuardImport,
        gqlDefaultAuthGuardImport,
        commonImport,
        swaggerImport,
      ].filter(
        (x) => x //remove nulls and undefined
      ) as namedTypes.ImportDeclaration[]
    );
    if (classDeclaration) {
      resolverMethodsIdsActionPairs(templateMapping, entity).forEach(
        ({ methodId, action, entity }) => {
          setAuthPermissions(classDeclaration, methodId, action, entity.name);
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

    //@ts-ignore
    classDeclaration.decorators = [guardDecorator];

    addInjectableDependency(
      classDeclaration,
      builders.identifier("rolesBuilder").name,
      builders.identifier("nestAccessControl.RolesBuilder"),
      "protected"
    );

    return eventParams;
  }

  beforeCreateEntityService(
    context: DsgContext,
    eventParams: CreateEntityServiceParams
  ) {
    const { template, serviceId, entityName, templateMapping } = eventParams;
    const modulePath = `${context.serverDirectories.srcDirectory}/${entityName}/${entityName}.service.ts`;
    const passwordFields = AuthCorePlugin.getPasswordFields(
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

  beforeCreateSeed(context: DsgContext, eventParams: CreateSeedParams) {
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

    const functionExp = builders.expressionStatement(
      builders.awaitExpression(
        builders.callExpression(
          builders.memberExpression(
            builders.memberExpression(
              builders.identifier("client"),
              builders.identifier("user")
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

  static createMutationDataMapping(
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
  beforeCreateEntityServiceBase(
    context: DsgContext,
    eventParams: CreateEntityServiceBaseParams
  ) {
    const { template, templateMapping, serviceBaseId, entityName, entity } =
      eventParams;
    const { serverDirectories } = context;
    const passwordFields = entity.fields.filter(isPasswordField);

    if (!passwordFields?.length) return eventParams;

    interpolate(template, templateMapping);

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
}

export default AuthCorePlugin;
