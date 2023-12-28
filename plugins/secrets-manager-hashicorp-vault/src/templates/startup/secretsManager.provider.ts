import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";
import { EnumSecretsNameKey } from "./secretsNameKey.enum";
import Vault from "node-vault";

export const SecretsManagerProvider = {
  provide: "SECRETS",
  useFactory: async (configService: ConfigService) => {
    const logger = new Logger();

    const vault = Vault({
      apiVersion: configService.get("VAULT_API_VER"),
      endpoint: configService.get("VAULT_ENDPOINT"),
    });
    VAULT_AUTH;

    let secrets: Partial<Record<EnumSecretsNameKey, unknown>> = {};

    for (const path of Object.values(EnumSecretsNameKey)) {
      const [secret_path, secret_name] = path.split(":");

      try {
        const secrets_list = (await vault.read(secret_path)).data.data;

        secrets = {
          ...secrets,
          [path]: secret_name ? secrets_list[secret_name] : secrets_list,
        };
      } catch (err: unknown) {
        if (err instanceof Error) {
          logger.error(
            `Error while loading secret named "${secret_name}" from path "${secret_path}" - ${err.message}`,
            "SecretsManager"
          );
        }
      }
    }

    return secrets;
  },
  inject: [ConfigService],
};
