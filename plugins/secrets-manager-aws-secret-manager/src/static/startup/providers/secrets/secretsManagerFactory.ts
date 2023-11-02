import { ConfigService } from "@nestjs/config";
import {
  GetSecretValueCommand,
  SecretsManagerClient
} from "@aws-sdk/client-secrets-manager"
import { Logger } from "@nestjs/common"
import { Secrets } from "./secrets";

export const secretsManagerFactory = {
  provide: "AWS_SECRETS_MANAGER",
  useFactory: async (configService: ConfigService): Promise<Record<string, string>> => {
    const logger = new Logger()

    const client = new SecretsManagerClient({
      region: configService.get("AWS_REGION")
    })

    var secrets: Record<string, string> = {}

    for (const [name, path] of Object.entries(Secrets)) {
      const [secret_id, secret_name] = path.split(":")

      try {
        const response = await client.send(new GetSecretValueCommand({ SecretId: secret_id }))

        const secrets_list: Record<string, string> = JSON.parse(
          response.SecretString ? response.SecretString :
            response.SecretBinary ? new TextDecoder().decode(response.SecretBinary) :
            "{}"
        )

        secrets = {
          ...secrets,
          ...(secret_name ? { [name]: secrets_list[secret_name] } : secrets_list)
        }
      } catch(err) {
        logger.warn(`Error while loading secret named "${secret_name}" from secret id "${secret_id}" - ${err.message}`, "SecretsManager")
      }
    }

    return secrets
  },
  inject: [ConfigService]
}

