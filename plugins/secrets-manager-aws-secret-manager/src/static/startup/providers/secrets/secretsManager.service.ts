import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SecretsManagerServiceBase } from "./base/secretsManager.service.base";
import { Secrets } from "./secrets";

@Injectable()
export class SecretsManagerService extends SecretsManagerServiceBase {
  constructor(
    @Inject("AWS_SECRETS_MANAGER")
    protected readonly secrets: Partial<Record<Secrets, unknown>>,
    protected readonly configService: ConfigService
  ) {
    super(configService);
  }

  async getSecret<T>(key: Secrets): Promise<T | null> {
    return this.secrets[key] as any
  }
}
