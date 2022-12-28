import {
  AmplicationPlugin,
  CreateEntityControllerBaseParams,
  CreateEntityControllerToManyRelationMethodsParams,
  CreateEntityModuleBaseParams,
  CreateEntityResolverBaseParams,
  CreateEntityResolverToManyRelationMethodsParams,
  CreateEntityResolverToOneRelationMethodsParams,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  DsgContext,
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
  addImports,
  getClassDeclarationById,
  importNames,
  interpolate,
} from "./util/ast";
import { builders, namedTypes } from "ast-types";
import { setAuthPermissions } from "./util/set-endpoint-permissions";
import {
  controllerMethodsIdsActionPairs,
  controllerToManyMethodsIdsActionPairs,
  resolverMethodsIdsActionPairs,
} from "./core/create-method-id-action-entity-map";

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
      CreateServerAuth: {
        after: this.afterCreateServerAuth,
      },
      CreateEntityModuleBase: {
        before: this.beforeCreateEntityModuleBase,
      },
      CreateEntityControllerBase: {
        before: this.beforeCreateControllerBaseModule,
      },
      CreateEntityControllerToManyRelationMethods: {
        before: this.beforeCreateEntityControllerToManyRelationMethods,
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

    return staticsFiles;
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
    // 6. create grants
    const grants = createGrantsModule(
      context.serverDirectories.srcDirectory,
      context.entities,
      context.roles
    );

    // 7. create create Default Guard
    const { resourceInfo, serverDirectories } = context;
    const authDir = `${serverDirectories.srcDirectory}/auth`;
    const authTestsDir = `${serverDirectories.srcDirectory}/tests/auth`;

    let defaultGuardFile: Module = {
      path: "",
      code: ""
    };
    if (resourceInfo) {
      defaultGuardFile = await createDefaultGuard(
        resourceInfo.settings.authProvider,
        authDir
      );
    }

    const results = grants
      ? [
          userInfo,
          tokenPayloadInterface,
          athConstants,
          tokenService,
          tokenServiceTest,
          ...staticsFiles,
          defaultGuardFile,
          grants,
        ]
      : [
          userInfo,
          tokenPayloadInterface,
          athConstants,
          tokenService,
          tokenServiceTest,
          ...staticsFiles,
          defaultGuardFile
        ];
    return results;
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

    const nestAccessControlImport = builders.importDeclaration(
      [
        builders.importNamespaceSpecifier(
          builders.identifier("nestAccessControl")
        ),
      ],
      builders.stringLiteral("nest-access-control")
    );

    const defaultAuthGuardId = builders.identifier("defaultAuthGuard");

    const defaultAuthGuardImport = importNames(
      [defaultAuthGuardId],
      "../../auth/defaultAuth.guard"
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

    gqlDefaultAuthGuardImport.specifiers;
    namedTypes.ImportNamespaceSpecifier;

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

    return eventParams;
  }
}

export default AuthCorePlugin;
