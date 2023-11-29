import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SecretsManagerServiceBase } from "./base/secretsManager.service.base";
import Vault from "node-vault";
import { EnumSecretsNameKey } from "./secretsNameKey.enum";

@Injectable()
export class SecretsManagerService extends SecretsManagerServiceBase {
  private readonly logger = new Logger();

  constructor(
    @Inject("SECRETS_CLIENT")
    protected readonly client: Vault.client,
    protected readonly configService: ConfigService,
  ) {
    super(configService);
  }

  async getSecret<T>(key: EnumSecretsNameKey): Promise<T | null> {
    const [secret_id, secret_name] = key.split(":");

    try {
      return (await this.client.read(secret_id)).data.data[secret_name];
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(
          `Error while loading secret named "${secret_name}" from secret id "${secret_id}" - ${err.message}`,
          "SecretsManager",
        );
      }
    }

    return null;
  }
}
