import {
  AmplicationPlugin,
  CreateEntityControllerBaseParams,
  CreateEntityModuleBaseParams,
  CreateServerDotEnvParams,
  CreateServerPackageJsonParams,
  DsgContext,
  Events,
} from "@amplication/code-gen-types";
import { envVariables } from "./constants";
import { resolve } from "path";
import {
  createUserInfo,
  createTokenPayloadInterface,
  createAuthConstants,
  createTokenService,
  createTokenServiceTests,
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
} from "./core/create-method-id-action-entity-map";

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
    return [
      userInfo,
      tokenPayloadInterface,
      athConstants,
      tokenService,
      tokenServiceTest,
      ...staticsFiles,
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

    const nestAccessControlId = builders.identifier("nestAccessControl");

    const nestAccessControlImport = importNames(
      [nestAccessControlId],
      "nest-access-control"
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
      console.log({ templateMapping });

      entity.fields.forEach((field) => {
        const relatedEntity = field.properties?.relatedEntity;
        if (relatedEntity) {
          controllerToManyMethodsIdsActionPairs(
            templateMapping,
            entity,
            relatedEntity
          );
          // ).forEach(({ methodId, action, entity }) => {
          //   setAuthPermissions(classDeclaration, methodId, action, entity.name);
          // });
        }
      });
    }

    return eventParams;
  }
}

export default AuthCorePlugin;
