import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SecretsManagerServiceBase } from "./base/secretsManager.service.base";
import { SECRETS_MANAGER_PROVIDER_KEY, SecretsType } from "./secretsManagerFactory";
import { EnumSecretsNameKey } from "./secretsNameKey.enum";

@Injectable()
export class SecretsManagerService extends SecretsManagerServiceBase {
    constructor(
        @Inject(SECRETS_MANAGER_PROVIDER_KEY)
        protected readonly secrets: SecretsType,
        protected readonly configService: ConfigService
    ) {
        super(configService);
    }

    async getSecret<T>(key: EnumSecretsNameKey): Promise<T | null> {
        return this.secrets[key] as any
    }
}