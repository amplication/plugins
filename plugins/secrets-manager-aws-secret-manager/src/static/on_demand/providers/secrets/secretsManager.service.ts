import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SecretsManagerServiceBase } from "./base/secretsManager.service.base";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

@Injectable()
export class SecretsManagerService extends SecretsManagerServiceBase {
  private readonly logger = new Logger()
  private readonly awsSecretsClient: SecretsManagerClient

  constructor(protected readonly configService: ConfigService) {
    super(configService);

    this.awsSecretsClient = new SecretsManagerClient({
      region: configService.get("AWS_REGION")
    })
  }

  async getSecret<T>(key: string): Promise<T | null> {
    const [secret_id, secret_name] = key.split(":")

    try {
      const response = await this.awsSecretsClient.send(new GetSecretValueCommand({ SecretId: secret_id }))

      const secrets_list: Record<string, string> = JSON.parse(
        response.SecretString ? response.SecretString :
        response.SecretBinary ? new TextDecoder().decode(response.SecretBinary) :
        "{}"
      )

      return secrets_list[secret_name] as any
    } catch(err: any) {
      this.logger.warn(`Error while loading secret named "${secret_name}" from secret id "${secret_id}" - ${err.message}`, "SecretsManager")
    }

    return null
  }
}
