import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SecretsManagerServiceBase } from "./base/secretsManager.service.base";
import { EnumSecretsNameKey } from "./secretsNameKey.enum";
import { secretsManagerFactoryProviderName } from "./secretsManagerFactory";

@Injectable()
export class SecretsManagerService extends SecretsManagerServiceBase {
  constructor(
    @Inject(secretsManagerFactoryProviderName)
    protected readonly secrets: Partial<Record<EnumSecretsNameKey, unknown>>,
    protected readonly configService: ConfigService,
  ) {
    super(configService);
  }

  async getSecret<T>(key: EnumSecretsNameKey): Promise<T | null> {
    return this.secrets[key] as any;
  }
}
