import {
  DsgContext,
  CreateServerDotEnvParams,
} from "@amplication/code-gen-types";
import { beforeCreateServerDotEnv as authCoreBeforeCreateServerDotEnv } from "@amplication/auth-core";

export function beforeCreateServerDotEnv(
  context: DsgContext,
  eventParams: CreateServerDotEnvParams,
): CreateServerDotEnvParams {
  // add default auth-core dependencies
  eventParams = authCoreBeforeCreateServerDotEnv(context, eventParams);
  const vars = {
    SAML_ENTRY_POINT:
      "# URL that goes from the Service Provider -> Identity Provider",
    SAML_ISSUER: "# issuer string to supply to identity provider. EntityID",
    SAML_DECRYPT_KEY: "# Service Provider response decryption key",
    SAML_PRIVATE_CERT: "# Service Provider private Certificate",
    SAML_PUBLIC_CERT: "# Identity Provider's public key",
    SAML_REDIRECT_CALLBACK_URL:
      "# Service Provider callback URL to client that will receive the access token",
  };
  const newEnvParams = [
    ...eventParams.envVariables,
    ...Object.entries(vars).map(([key, value]) => ({ [key]: value })),
  ];
  return { envVariables: newEnvParams };
}
