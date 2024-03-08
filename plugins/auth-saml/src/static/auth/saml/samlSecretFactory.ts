import { SamlConfig } from "@node-saml/passport-saml";
import { SecretsManagerService } from "../../providers/secrets/secretsManager.service";
import { EnumSecretsNameKey } from "../../providers/secrets/secretsNameKey.enum";
import { SAML_STRATEGY_NAME } from "./saml.constant";
import { config } from "dotenv";
import { ConfigService } from "@nestjs/config";

export const SAML_SECRETS_PROVIDER_NAME = "SAML_SECRETS_PROVIDER_NAME";

export const samlSecretFactory = {
  provide: SAML_SECRETS_PROVIDER_NAME,
  useFactory: async (
    configService: ConfigService,
    secretsManagerService: SecretsManagerService
  ): Promise<SamlConfig> => {
    const decryptionPvk = await secretsManagerService.getSecret<string>(
      EnumSecretsNameKey.SamlDecryptKey
    );

    const privateKey = await secretsManagerService.getSecret<string>(
      EnumSecretsNameKey.SamlPrivateCert
    );

    const cert = await secretsManagerService.getSecret<string>(
      EnumSecretsNameKey.SamlPublicCert
    );

    if (!decryptionPvk || !privateKey || !cert) {
      throw new Error(
        `SAML secrets are missing. decryptionPvk:${decryptionPvk} - privateKey:${privateKey} - cert:${cert}`
      );
    }

    return {
      name: SAML_STRATEGY_NAME,
      // URL that goes from the Service Provider -> Identity Provider
      entryPoint: configService.get<string>("SAML_ENTRY_POINT"),
      // URL that goes from the Identity Provider -> Service Provider
      path: "/api/login/callback",
      issuer: configService.getOrThrow<string>("SAML_ISSUER"),
      // Service Provider private key
      decryptionPvk,
      // Service Provider Certificate
      privateKey,
      // Identity Provider's public key
      cert,
      identifierFormat: null,
    };
  },
  inject: [ConfigService, SecretsManagerService],
};
