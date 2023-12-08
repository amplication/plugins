import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SecretsManagerServiceBase } from "./base/secretsManager.service.base";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretsList } from "./secretsManagerFactory";
import { EnumSecretsNameKey } from "./secretsNameKey.enum";

@Injectable()
export class SecretsManagerService extends SecretsManagerServiceBase {
  constructor(
    @Inject("AZURE_KEY_VAULT")
    protected readonly secrets: SecretsList,
    protected readonly configService: ConfigService
  ) {
    super(configService);
  }

  async getSecret<T>(key: EnumSecretsNameKey): Promise<T | null> {
    return this.secrets[key] as any
  }
}