import {
  CreateServerAuthParams,
  DsgContext,
  ModuleMap,
} from "@amplication/code-gen-types";
import { resolve } from "path";
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
} from "../core";
import { getStaticFiles } from "../util/file";

export async function afterCreateServerAuth(
  context: DsgContext,
  eventParams: CreateServerAuthParams,
  modules: ModuleMap
): Promise<ModuleMap> {
  const staticPath = resolve(__dirname, "./static/auth");

  const interceptorsStaticPath = resolve(__dirname, "./static/interceptors");

  const staticsInterceptorsFiles = await getStaticFiles(
    context,
    `${context.serverDirectories.srcDirectory}/interceptors`,
    interceptorsStaticPath
  );

  const staticsFiles = await getStaticFiles(
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
