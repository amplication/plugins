import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SecretsManagerServiceBase } from "./base/secretsManager.service.base";

@Injectable()
export class SecretsManagerService extends SecretsManagerServiceBase {
  constructor(
    @Inject("AWS_SECRETS_MANAGER")
    protected readonly secrets: Record<string, any>,
    protected readonly configService: ConfigService
  ) {
    super(configService);
  }

  async getSecret<T>(key: string): Promise<T | null> {
    return this.secrets[key] as any
  }
}