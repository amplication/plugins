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
