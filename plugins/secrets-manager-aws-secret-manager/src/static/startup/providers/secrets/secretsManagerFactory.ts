import { ConfigService } from "@nestjs/config";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { Logger } from "@nestjs/common";
import { EnumSecretsNameKey } from "./secretsNameKey.enum";

export const secretsManagerFactory = {
  provide: "AWS_SECRETS_MANAGER",
  useFactory: async (configService: ConfigService) => {
    const logger = new Logger();

    const client = new SecretsManagerClient({
      region: configService.get("AWS_REGION"),
    });

    var secrets: Partial<Record<EnumSecretsNameKey, unknown>> = {};

    for (const path of Object.values(EnumSecretsNameKey)) {
      const [secret_id, secret_name] = path.toString().split(":");

      try {
        const response = await client.send(
          new GetSecretValueCommand({ SecretId: secret_id }),
        );

        const secrets_list: Record<string, string> = JSON.parse(
          response.SecretString
            ? response.SecretString
            : response.SecretBinary
              ? new TextDecoder().decode(response.SecretBinary)
              : "{}",
        );

        secrets = {
          ...secrets,
          [path.toString()]: secret_name
            ? secrets_list[secret_name]
            : secrets_list,
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          logger.error(
            `Error while loading secret named "${secret_name}" from secret id "${secret_id}" - ${err.message}`,
            "SecretsManager",
          );
        }
      }
    }

    return secrets;
  },
  inject: [ConfigService],
};
