import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  BitwardenClient,
  ClientSettings,
  DeviceType,
  LogLevel,
  SecretIdentifierResponse,
} from "@bitwarden/sdk-napi";
import { EnumSecretsNameKey } from "./secretsNameKey.enum";

export const secretsManagerFactoryProviderName = "BITWARDEN_SECRETS_MANAGER";

export const secretsManagerFactory = {
  provide: secretsManagerFactoryProviderName,
  useFactory: async (configService: ConfigService) => {
    const logger = new Logger();
    const settings: ClientSettings = {
      apiUrl: configService.get("BITWARDEN_API_URL"),
      identityUrl: configService.get("BITWARDEN_IDENTITY_URL"),
      userAgent: "Bitwarden SDK",
      deviceType: DeviceType.SDK,
    };
    const accessToken = configService.get("BITWARDEN_ACCESS_TOKEN")!;
    const organisationId = configService.get("BITWARDEN_ORGANISATION_ID")!;
    const bitwardenClient = new BitwardenClient(settings, LogLevel.Info);

    const auth = await bitwardenClient.loginWithAccessToken(accessToken);
    if (!auth.success) {
      logger.error(
        `Bitwarden authentication failed: ${auth.errorMessage}`,
        "SecretsManager",
      );
      // throw Error(`Bitwarden authentication failed: ${auth.errorMessage}`);
    }

    const secretsList = await bitwardenClient.secrets().list(organisationId);
    if (!secretsList.success) {
      logger.error(
        `Error while fetching secrets : ${secretsList.errorMessage}`,
        "SecretsManager",
      );
      // throw Error(`Error while fetching secrets : ${secretsList.errorMessage}`);
    }

    const secretsNamesIds: string[] = [];
    secretsList.data?.data.forEach((sec: SecretIdentifierResponse) => {
      if (
        Object.values(EnumSecretsNameKey).includes(
          sec.key as EnumSecretsNameKey,
        )
      ) {
        secretsNamesIds.push(sec.id);
      }
    });

    const response = await bitwardenClient.secrets().getByIds(secretsNamesIds);
    if (response.success) {
      logger.error(
        `Error fetching secrets from secretManager :
                ${response.errorMessage}`,
        "SecretsManager",
      );
      // throw Error(`Error fetching secrets from secretManager :${response.errorMessage}`)
    }

    var secrets: Partial<Record<EnumSecretsNameKey, unknown>> = {};

    if (response.data) {
      for (const secret of response.data?.data) {
        secrets = {
          ...secrets,
          [secret.key]: secret.value,
        };
      }

      return secrets;
    }
  },
  inject: [ConfigService],
};
