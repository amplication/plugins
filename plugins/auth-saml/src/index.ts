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
  AUTH_ENTITY_FIELD_USERNAME,
  updateDockerComposeProperties,
} from "./constants";
import { getPluginSettings } from "./util/getPluginSettings";
import { merge } from "lodash";
import {} from "@amplication/auth-core-shared";

class SamlAuthPlugin implements AmplicationPlugin {
  register(): Events {
    return {
      CreateServer: {
        before: this.beforeCreateServer,
      },
      CreateAdminUI: {
        before: this.beforeCreateAdminModules,
      },
      CreateServerAuth: {
        before: this.beforeCreateAuthModules,
        after: this.afterCreateAuthModules,
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
      CreateServerAppModule: {
        before: beforeCreateAppModule,
        after: afterCreateAppModule,
      },
    };
  }

  beforeCreateServer(context: DsgContext, eventParams: CreateServerParams) {
    const authEntity = context.entities?.find(
      (x) => x.name === context.resourceInfo?.settings.authEntityName,
    );
    if (!authEntity) {
      throw new Error(`Authentication entity does not exist`);
    }

    const requiredFields = [AUTH_ENTITY_FIELD_USERNAME];

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

  beforeCreateAdminModules(
    context: DsgContext,
    eventParams: CreateAdminUIParams,
  ) {
    if (context.resourceInfo) {
      context.resourceInfo.settings.authProvider = EnumAuthProviderType.Jwt;
    }

    return eventParams;
  }

  beforeCreateAuthModules(
    context: DsgContext,
    eventParams: CreateServerAuthParams,
  ) {
    context.utils.skipDefaultBehavior = true;
    return eventParams;
  }

  async afterCreateAuthModules(
    context: DsgContext,
    eventParams: CreateServerAuthParams,
    modules: ModuleMap,
  ): Promise<ModuleMap> {
    const staticPath = resolve(__dirname, "./static");

    const staticsFiles = await context.utils.importStaticModules(
      staticPath,
      context.serverDirectories.srcDirectory,
    );

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

    await modules.merge(staticsFiles);
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
    await dsgContext.logger.warn("beforeCreateSecretsManager", { eventParams });
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
    const myValues = {
      dependencies: {
        "@node-saml/passport-saml": "^10.1.1",
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
