import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SecretsManagerServiceBase } from "./base/secretsManager.service.base";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { EnumSecretsNameKey } from "./secretsNameKey.enum";

@Injectable()
export class SecretsManagerService extends SecretsManagerServiceBase {
  private readonly logger = new Logger("SecretsManager")
  private readonly client: SecretClient

  constructor(protected readonly configService: ConfigService) {
    super(configService);

    const credential = new DefaultAzureCredential();
    const url = `https://${configService.get("AZURE_VAULT_NAME")}.vault.azure.net`

    this.client = new SecretClient(url, credential)
  }

  async getSecret<T>(key: EnumSecretsNameKey): Promise<T | null> {
    const [name, version] = key.split(":")

    try {
      const secret = await this.client.getSecret(name, {
        version: version ?? null
      })

      return secret.value as any
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(`Error while loading the secret ${name} version ${version} - ${err.message}`)
      }

      return null
    }
  }
}