import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SecretsManagerServiceBase } from "./base/secretsManager.service.base";
import {
  BitwardenClient,
  ClientSettings,
  DeviceType,
  LogLevel,
  SecretIdentifierResponse,
} from "@bitwarden/sdk-napi";
import { EnumSecretsNameKey } from "./secretsNameKey.enum";

@Injectable()
export class SecretsManagerService extends SecretsManagerServiceBase {
  private readonly logger = new Logger();
  private readonly settings: ClientSettings;
  private readonly organisationId: string;
  private readonly accessToken: string;
  private readonly bitwardenClient: BitwardenClient;

  constructor(protected readonly configService: ConfigService) {
    super(configService);

    this.settings = {
      apiUrl: this.configService.get("BITWARDEN_API_URL"),
      identityUrl: this.configService.get("BITWARDEN_IDENTITY_URL"),
      userAgent: "Bitwarden SDK",
      deviceType: DeviceType.SDK,
    };
    this.accessToken = configService.get("BITWARDEN_ACCESS_TOKEN")!;
    this.organisationId = configService.get("BITWARDEN_ORGANISATION_ID")!;
    this.bitwardenClient = new BitwardenClient(this.settings, LogLevel.Info);
  }

  async getSecret<T>(key: EnumSecretsNameKey): Promise<T | null> {
    const auth = await this.bitwardenClient.loginWithAccessToken(
      this.accessToken,
    );
    if (!auth.success) {
      this.logger.error(
        `Bitwarden authentication failed: ${auth.errorMessage}`,
        "SecretsManager",
      );
      // throw Error(`Bitwarden authentication failed: ${auth.errorMessage}`);
    }

    const secretsList = await this.bitwardenClient
      .secrets()
      .list(this.organisationId);
    if (!secretsList.success) {
      this.logger.error(
        `Error while fetching secrets : ${secretsList.errorMessage}`,
        "SecretsManager",
      );
      // throw Error(`Error while fetching secrets : ${secretsList.errorMessage}`);
    }

    if (secretsList.data) {
      const secretData = secretsList.data.data.filter(
        (sec: SecretIdentifierResponse) => sec.key === key,
      );

      if (secretData.length > 0) {
        const secret = await this.bitwardenClient
          .secrets()
          .get(secretData[0].id);
        if (!secret.success) {
          this.logger.error(
            `Error fetching secret with key: ${key} from secretManager :
          ${secret.errorMessage}`,
            "SecretsManager",
          );
          // throw Error(`Error fetching secret with key: ${key} from secretManager.${secret.errorMessage}`)
        }

        if (secret.data) {
          return secret.data.value as any;
        }
      } else {
        this.logger.error(`Secret with key: '${key}' not found.`);
      }
    }

    return null;
  }
}
