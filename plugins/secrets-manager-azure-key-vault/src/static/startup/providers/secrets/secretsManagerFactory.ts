import { DefaultAzureCredential } from "@azure/identity";
import { ConfigService } from "@nestjs/config";
import { SecretClient } from "@azure/keyvault-secrets";
import { EnumSecretsNameKey } from "./secretsNameKey.enum";
import { Logger } from "@nestjs/common";

export type SecretsList = Partial<Record<EnumSecretsNameKey, unknown>>;

export const SecretsManagerFactory = {
  provide: "AZURE_KEY_VAULT",
  useFactory: async (configService: ConfigService) => {
    const logger = new Logger("SecretsManager");
    const credential = new DefaultAzureCredential();

    const url = `https://${configService.get("AZURE_VAULT_NAME")}.vault.azure.net`;

    const client = new SecretClient(url, credential);

    var secrets: SecretsList = {};

    for (const path of Object.values(EnumSecretsNameKey)) {
      const [name, version] = path.split(":");

      try {
        const secret = await client.getSecret(name, {
          version: version ?? null,
        });

        secrets = { ...secrets, [path]: secret.value };
      } catch (err: unknown) {
        if (err instanceof Error) {
          logger.error(
            `Error while loading the secret ${name} version ${version} - ${err.message}`,
          );
        }
      }
    }

    return secrets;
  },
  inject: [ConfigService],
};
