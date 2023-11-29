import { Logger, Provider } from "@nestjs/common";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager"
import { EnumSecretsNameKey } from "./secretsNameKey.enum";
import { ConfigService } from "@nestjs/config";

export const SECRETS_MANAGER_PROVIDER_KEY = "GCP_SECRETS_MANAGER"
export type SecretsType = Partial<Record<EnumSecretsNameKey, unknown>>

export const SecretsManagerFactory: Provider = {
    provide: SECRETS_MANAGER_PROVIDER_KEY,
    useFactory: async (configService: ConfigService) => {
        const client = new SecretManagerServiceClient()
        const logger = new Logger("SecretsManager")

        const projectID = configService.get("GCP_RESOURCE_ID")

        var secrets: SecretsType = {}

        for (const secret of Object.values(EnumSecretsNameKey)) {
            const [name, version] = secret.split(":")

            try {
                const [ accessResponse ] = await client.accessSecretVersion({
                    name: `projects/${projectID}/secrets/${name}/versions/${version ?? 1}`
                })

                secrets = {
                    ...secrets,
                    [secret]: accessResponse.payload?.data?.toString() ?? ""
                }
            } catch(err: unknown) {
                if(err instanceof Error) {
                    logger.error(`Error while loading secret ${name} (version ${version}) - ${err.message}`)
                }
            }
        }

        return secrets
    },
    inject: [ConfigService]
}