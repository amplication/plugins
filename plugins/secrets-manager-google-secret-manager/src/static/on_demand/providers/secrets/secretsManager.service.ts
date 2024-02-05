import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SecretsManagerServiceBase } from "./base/secretsManager.service.base";
import { EnumSecretsNameKey } from "./secretsNameKey.enum";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

@Injectable()
export class SecretsManagerService extends SecretsManagerServiceBase {
    protected readonly client: SecretManagerServiceClient
    protected readonly logger: Logger
    protected readonly projectId: string

    constructor(protected readonly configService: ConfigService) {
        super(configService);

        this.client = new SecretManagerServiceClient()
        this.logger = new Logger(SecretsManagerService.name)
        this.projectId = configService.get("GCP_RESOURCE_ID") ?? ""
    }

    async getSecret<T>(key: EnumSecretsNameKey): Promise<T | null> {
        const [name, version] = key.split(":")

        try {
            const [accessResponse] = await this.client.accessSecretVersion({
                name: `projects/${this.projectId}/secrets/${name}/versions/${version ?? 1}`
            })

            return accessResponse.payload?.data?.toString() as any
        } catch (err) {
            if (err instanceof Error) {
                this.logger.error(`Error while loading secret ${name} (version ${version}) - ${err.message}`)
            }

            return null
        }
    }
}