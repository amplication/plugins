import {
  CreateServerAuthParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import {
  createUserInfo,
  createTokenPayloadInterface,
  createAuthConstants,
  createAuthController,
  createAuthResolver,
  createAuthService,
  createIAuthStrategy,
  createAuthServiceSpec,
  createUserDataDecorator,
  createCustomSeed,
} from "@amplication/auth-core";
import { resolve } from "path";
import {
  createAuthModule,
  createJwtStrategy,
  createJwtStrategyBase,
  createJwtStrategySpec,
  createSamlStrategy,
  createSamlStrategyBase,
} from "../core";
import { serverStaticsPath } from "../constants";

export function beforeCreateServerAuth(
  context: DsgContext,
  eventParams: CreateServerAuthParams,
) {
  context.utils.skipDefaultBehavior = true;
  return eventParams;
}

export async function afterCreateServerAuth(
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
