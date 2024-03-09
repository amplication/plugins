import {
  DsgContext,
  CreateServerSecretsManagerParams,
} from "@amplication/code-gen-types";
import { getPluginSettings } from "../util/getPluginSettings";

export async function beforeCreateSecretsManager(
  dsgContext: DsgContext,
  eventParams: CreateServerSecretsManagerParams,
): Promise<CreateServerSecretsManagerParams> {
  const settings = getPluginSettings(dsgContext.pluginInstallations);
  eventParams.secretsNameKey.push(
    ...[
      {
        name: "JwtSecretKey", // Used in jwt strategy as Enum key
        key: settings.JwtSecretKeyReference,
      },
      {
        name: "SamlDecryptKey",
        key: settings.SamlSPDecryptionCertReference,
      },
      {
        name: "SamlPrivateCert",
        key: settings.SamlSPPrivateCertReference,
      },
      {
        name: "SamlPublicCert",
        key: settings.SamlIdpPublicCertReference,
      },
    ],
  );
  return eventParams;
}
