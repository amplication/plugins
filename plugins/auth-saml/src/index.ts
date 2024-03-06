import {
  AmplicationPlugin,
  CreateAdminUIParams,
  CreateServerAuthParams,
  CreateServerParams,
  CreateServerDockerComposeParams,
  CreateServerSecretsManagerParams,
  DsgContext,
  Events,
  ModuleMap,
  CreateServerPackageJsonParams,
  CreateServerDotEnvParams,
} from "@amplication/code-gen-types";
import { EnumAuthProviderType } from "@amplication/code-gen-types/src/models";
import { resolve } from "path";
import {
  createAuthModule,
  createJwtStrategy,
  createJwtStrategyBase,
  createJwtStrategySpec,
  createSamlStrategy,
  createSamlStrategyBase,
} from "./core";
import {
  AUTH_ENTITY_FIELD_SESSION_ID,
  AUTH_ENTITY_FIELD_USERNAME,
  serverStaticsPath,
  updateDockerComposeProperties,
} from "./constants";
import { getPluginSettings } from "./util/getPluginSettings";
import { merge } from "lodash";
import {
  AuthCorePlugin,
  createAuthConstants,
  createAuthController,
  createAuthResolver,
  createAuthService,
  createAuthServiceSpec,
  createCustomSeed,
  createIAuthStrategy,
  createTokenPayloadInterface,
  createUserDataDecorator,
  createUserInfo,
  beforeCreateServer as authCoreBeforeCreateServer,
  beforeCreateServerPackageJson as authCoreBeforeCreateServerPackageJson,
  beforeCreateServerDotEnv as authCoreBeforeCreateServerDotEnv,
} from "@amplication/auth-core";

class SamlAuthPlugin extends AuthCorePlugin implements AmplicationPlugin {
  constructor() {
    super(new Set([]));
  }

  register(): Events {
    return merge(super.register(), {
      CreateServer: {
        before: this.beforeCreateServer,
      },
      CreateAdminUI: {
        before: this.beforeCreateAdminUI,
      },
      CreateServerAuth: {
        before: this.beforeCreateServerAuth,
        after: this.afterCreateServerAuth,
      },
      CreateServerDockerCompose: {
        before: this.beforeCreateDockerComposeFile,
      },
      CreateServerSecretsManager: {
        before: this.beforeCreateSecretsManager,
      },
      CreateServerPackageJson: {
        before: this.beforeCreateServerPackageJson,
      },
      CreateServerDotEnv: {
        before: this.beforeCreateServerDotEnv,
      },
    });
  }

  beforeCreateServer(context: DsgContext, eventParams: CreateServerParams) {
    eventParams = authCoreBeforeCreateServer(context, eventParams);

    const authEntity = context.entities?.find(
      (x) => x.name === context.resourceInfo?.settings.authEntityName,
    );
    if (!authEntity) {
      throw new Error(`Authentication entity does not exist`);
    }

    const requiredFields = [
      AUTH_ENTITY_FIELD_USERNAME,
      AUTH_ENTITY_FIELD_SESSION_ID,
    ];

    requiredFields.forEach((requiredField) => {
      const field = authEntity.fields.find(
        (field) => field.name === requiredField,
      );
      if (!field) {
        throw new Error(
          `Authentication entity must have a field named ${requiredField}`,
        );
      }
    });

    return eventParams;
  }

  beforeCreateAdminUI(context: DsgContext, eventParams: CreateAdminUIParams) {
    if (context.resourceInfo) {
      context.resourceInfo.settings.authProvider = EnumAuthProviderType.Jwt;
    }

    return eventParams;
  }

  beforeCreateServerAuth(
    context: DsgContext,
    eventParams: CreateServerAuthParams,
  ) {
    context.utils.skipDefaultBehavior = true;
    return eventParams;
  }

  async afterCreateServerAuth(
    context: DsgContext,
    eventParams: CreateServerAuthParams,
    modules: ModuleMap,
  ): Promise<ModuleMap> {
    const staticAuthPath = resolve(__dirname, "./static/auth");

    const interceptorsStaticAuthPath = resolve(
      __dirname,
      "./static/interceptors",
    );

    const staticAuthInterceptorsFiles = await context.utils.importStaticModules(
      interceptorsStaticAuthPath,
      `${context.serverDirectories.srcDirectory}/interceptors`,
    );

    const staticAuthFiles = await context.utils.importStaticModules(
      staticAuthPath,
      context.serverDirectories.authDirectory,
    );

    const staticFiles = await context.utils.importStaticModules(
      serverStaticsPath,
      context.serverDirectories.srcDirectory,
    );

    await modules.mergeMany([
      staticAuthInterceptorsFiles,
      staticAuthFiles,
      staticFiles,
    ]);

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

    // create samlStrategy base file.
    const samlStrategyBase = await createSamlStrategyBase(context);
    await modules.set(samlStrategyBase);

    // create jwtStrategy file.
    const samlStrategy = await createSamlStrategy(context);
    await modules.set(samlStrategy);

    // create jwtStrategy base file.
    const jwyStrategyBase = await createJwtStrategyBase(context);
    await modules.set(jwyStrategyBase);

    // create jwtStrategy  file.
    const jwyStrategy = await createJwtStrategy(context);
    await modules.set(jwyStrategy);

    // create auth module  file.
    const authModule = await createAuthModule(context);
    await modules.set(authModule);

    // create jwtStrategy spec file.
    const jwyStrategySpec = await createJwtStrategySpec(context);
    await modules.set(jwyStrategySpec);

    return modules;
  }

  beforeCreateDockerComposeFile(
    dsgContext: DsgContext,
    eventParams: CreateServerDockerComposeParams,
  ): CreateServerDockerComposeParams {
    eventParams.updateProperties.push(...updateDockerComposeProperties);
    return eventParams;
  }

  async beforeCreateSecretsManager(
    dsgContext: DsgContext,
    eventParams: CreateServerSecretsManagerParams,
  ): Promise<CreateServerSecretsManagerParams> {
    const settings = getPluginSettings(dsgContext.pluginInstallations);
    eventParams.secretsNameKey.push({
      name: "JwtSecretKey", // Used in jwt strategy as Enum key
      key: settings.JwtSecretKeyReference,
    });
    return eventParams;
  }

  beforeCreateServerPackageJson(
    context: DsgContext,
    eventParams: CreateServerPackageJsonParams,
  ) {
    // add default auth-core dependencies
    eventParams = authCoreBeforeCreateServerPackageJson(context, eventParams);

    const myValues = {
      dependencies: {
        "@node-saml/passport-saml": "^4.0.4",
      },
    };

    eventParams.updateProperties.forEach((updateProperty) =>
      merge(updateProperty, myValues),
    );

    return eventParams;
  }

  beforeCreateServerDotEnv(
    context: DsgContext,
    eventParams: CreateServerDotEnvParams,
  ): CreateServerDotEnvParams {
    // add default auth-core dependencies
    eventParams = authCoreBeforeCreateServerDotEnv(context, eventParams);
    const vars = {
      SAML_ENTRY_POINT: "${SAML_ENTRY_POINT}",
      SAML_ISSUER: "${SAML_ISSUER}",
      SAML_CERT: "${SAML_CERT}",
      SAML_PUBLIC_CERT: "${SAML_PUBLIC_CERT}",
      SAML_REDIRECT_CALLBACK_URL: "${SAML_REDIRECT_CALLBACK_URL}",
    };
    const newEnvParams = [
      ...eventParams.envVariables,
      ...Object.entries(vars).map(([key, value]) => ({ [key]: value })),
    ];
    return { envVariables: newEnvParams };
  }
}

export default SamlAuthPlugin;
